---
layout: post
title: 阅读VSCode源码-01
date: 2021-06-01 00:00
comments: true
external-url:
categories: VSCode
---

基础: VSCode的技术栈相对比较繁杂，但大体上涵盖了Electron, TypeScript等相应的技术，其中
Electron可以理解为Chromium + node.js + 操作系统原生菜单、状态栏等。

## Chromium

Chromium 使用了多进程架构，分为Browser Process和Render Process，Render Process使用Blink和V8, Blink用于计算布局，V8用于运行JavaScript代码，真正渲染到屏幕上的一个一个的像素，是在 Browser Process 完成的，Browser Process和Render Process通过IPC进程通信(使用 Mojo), Browser Process 可以保证安全(用于渲染到屏幕，管理Cookie、Storage、网络请求等), 而Render Process是在沙盒里运行的。

## Electron

Electron 在 Chromium 基础上，给 Browser Process 和 Render Process 加进了 Node Enviroment，这样，带来了 Node 开发者，带来了丰富的NPM包，并且，不论是Browser Process还是Render Process，都能直接调用Node API, 从而获得 Native能力。同时，Electron 还给 Browser Process和Render Process加进了 Electron API, 为开发者提供了 Browser Process和Render Process的IPC通信API，以及提供一些必要的功能。

以下用主进程表示 Browser Process，用渲染进程表示 Render Process

## VSCode 初始化过程

为了方便，文件名不加后缀，比如 src/main 实际为 src/main.js，而src/vs/code/eletron-main/main 实际为 src/vs/code/electron-main/main.ts

  * Electron 根据根目录下 package.json文件中的 main 字段，在主进程加载 src/main, 处理本地语言配置以及 process.env
  * 加载 src/vs/code/electron-main/main，实例化 CodeMain 类，调用该类中的 main() 方法，创建主进程中外层的 InstantiationService，并实例化 CodeApplication 类，调用该类中的 startup() 方法。InstantiationService 用于实例化其他类，使得其他类在主进程或者渲染进程中，在保持单利的同时又能很方便的作为构造器参数传入，这个类是 VSCode 工程中实现依赖注入的重要部分。
  * 在 CodeApplication 类的 startup() 方法中，再次创建 InstantiationService，该 InstantiationService 是外层 InstantiationService 的 child，并且如果某个类的实例在当前窗口的 InstantiationService 中找不到时，会去外层的 InstantiationService 中查找，然后实例化各个 Service 类，并最终在 src/vs/code/electron-main/window 中调用 new BrowserWindow(options)，打开窗口，携带处理完毕的配置参数加载渲染进程的代码 src/vs/code/electron-browser/workbench/workbench
  * 加载 src/vs/workbench/electron-browser/main 实例化渲染进程各个 Service 类放入 serviceCollection，然后用 serviceCollection 去实例化渲染进程的 InstatiationService
  * 加载后续代码，用 TypeScript 操作 DOM，计算Layout，生成页面

## 用Service划分各个功能的界限

VScode 中有许多 Service，有的位于主进程，有的位于渲染进程，有的只在主进程使用，有的只在渲染进程使用，有的在主进程定义逻辑，在渲染进程通过 Electron 提供 IPC 建立Proxy使用(对于 Service 使用者来说无感知)，Service 位于 src/vs/platform 目录，主要有 IInstantiationService, IEnviromentService, IFileService, ILayoutService, INotificationService, IOpenerService, IStorageService, IWindowService, IWindowsMainService, IWorkspaceService, IWorkspacesMainService 等

## 依赖注入 Dependency Injection

关于依赖注入的整体介绍，VSCode wiki已经讲的很清楚了:

VSCode 是围绕服务来组织的，其中大多数是在 platform 层定义的。服务通过 constructor injection(构造器注入)来得到客户端。一个服务定义分为两个部分:(1) 一个服务的 interface 和 (2) 一个服务的标识符。后者是必须的，因为TypeScript不使用名义类型，但是结构类型。服务标识符是一个装饰器(由ES7提出的)，应该与服务接口具有相同的名称。

声明一个服务依赖是通过向构造函数参数添加相应的装饰器来实现的。在下边的代码片段里 @IModelService 是一个服务标识符装饰器，IModelService 是此参数的(选项)类型注释。当一个依赖是一个选项时，使用 @optional 装饰器否则实例化服务将抛出错误。

```typescript
class Client {
  construtor(
    @IModelService modelService: IModelService,
    @optional(IEditorService) editorService: IEditorService
  ) {
    // use services
  }
}
```

使用实例服务为服务使用者创建实例，如 instantiationService.createInstance(client)。通常这是作为一个贡献者注册时才这么做，像 Viewlet 或 Language

下面从代码角度说明一下：

* 使用装饰器(注解)将依赖以变量的形式存到Class上

```typescript
// src/vs/platform/instatiation/common/instatiation.ts
export function createDecorator<T>(serciceId: string): ServiceIdentifier<T> {
  if (_util.serviceIds.has(serviceId)) {
    return _util.serviceIds.get(serviceId)!;
  }

  // 根据TypeScript的规定，实现注解函数
  const id = <any>function (target: Function, key: string, index: number): any {
    if (arguments.length !== 3) {
      throw new Error('@IServiceName-decorator can only be used to decorate a parameter');
    }
    storeServiceDependecy(id, target, index, false);
  };

  id.toString = () => serviceId;

  _util.serviceIds.set(serviceId, id);
  return id;
}

function storeServiceDependency(id: Function, target: Function, index: number, optional: boolean): void {
  // 在运行时，将注解保存到 target(Class)，方便之后计算 graph
  if (target[_util.DI_TARGET] === target) {
    target[_util.DI_DEPENDENCIES].push({ id, index, optional });
  } else {
    target[_util.DI_DEPENDENCIES] = [{ id, index, optional }];
    target[_util.DI_TARGET] = target;
  }
}
```

* 根据已有信息计算依赖，构造有向图
* 找出出度为0的节点，并从这些几点开始，用 instantiationService.createInstance(Client) 初始化实例
<img src="../assets/images/2021-6/instantiationService.createInstance.png" width="80%">

其中，Class-A 为当前需要实例化的类，graph生成完毕之后，根据规则，先实例化 Dependence-Class-C、Dependence-Class-E、Dependence-Class-F，再实例化 Dependence-Class-B、Dependence-Class-D, 最后才实例化 Class-A

```typescript
// src/vs/platform/instantiation/common/instantiationService.ts
private _createAndCacheServiceInstance<T>(id: ServiceIdentifier<T>, desc: SyncDescriptor<T>, _trace: Trace): T {
  type Triple = { id: ServiceIdentifier<any>, desc: SyncDescriptor<any>, _trace: Trace };
  // 有向图，保存出度和入度
  const graph = new Graph<Triple>(data => data.id.toString());

  function throwCycleError() {
    // 服务之间的循环依赖关系
    const err = new Error('[createInstance] cyclic dependency between services');
    err.message = graph.toString();
    throw err;
  }

  let count = 0;
  const stack = [{ id, desc, _trace }];
  while (stack.length) {
    const item = stack.pop()!;
    graph.looupOrInsertNode(item);

    // TODO@joh use the graph to find a cycle
    // a tweak heuristic for cycle checks
    // 使用 graph 找出一个循环
    // 一种用于循环检查的调整启动法
    if (count++ > 100) {
      throwCycleError();
    }

    // check all dependencies for existence and if they need to be created first
    // 检查所有依赖项是否存在，以及是否需要首先创建它们
    let dependencies = _utile.getServiceDependencies(item.desc.ctor);
    for (let dependency of dependencies) {

      let instanceOrDesc = this._getServiceInstaceOrDescriptor(dependency.id);
      if (!instanceOrDesc && !dependency.optional) {
        console.warn(`[createIntance] ${id} depends on ${dependency.di} which is NOT registered.`);
      }

      if (instanceOrDesc instanceof SyncDescriptor) {
        const d = { id: dependency.di, desc: instanceOrDesc, _trac: item._trace.branch(dependency.id, true) };
        // 从 item 节点指向 d 节点
        graph.insertEdge(item, d);
        stack.push(d);
      }
    }
  }

  while (true) {
    // 找出出度为0的节点

    let roots = graph.roots();

    // if there is no more roots but still
    // nodes in the graph we have a cycle
    // 如果 graph 中没有根，但仍然有接节点，我们就有一个循环
    if (roots.length === 0) {
      if (!graph.isEmpty()) {
        throwCycleError();
      }
      break;
    }

    for (let { data } of roots) {
      // create instance and overwrite the service collections
      const instance = this._createServiceInstanceWithOwner(data.id, data.desc.ctor, data.desc.staticArguments, data.desc.supportsDelayedInstantiation, data._trace);
      this._setServiceInstance(data.id, instace);
      graph.removeNode(data);
    }
  }

  return <T>this._getServiceInstaceOrDescriptor(id);
}
```

* 值得说明的是，实例化是支持懒加载的，懒加载使用代理模式，懒加载的实现原理如下:

```typescript
private _createServiceInstance<T>(ctor: any, args: any[] = [], _supportsDeplayedInstantiation: boolean, _trace: Trace): T {
  if (!_supportsDeplayedInstantiation || !_canUseProxy) {
    // eager instantiation or no support JS proxies (e.g. IE11)
    // 急于实例化或不支持JS代理(如 IE11)
    return this._createInstance(ctor, args, _trace);
  } else {
    // Return a proxy object that's backed by an idle value. That
    // strategy is to instantiate services in our idle time or when actually
    // needed but not when injected into a consumer
    const idle = new IdleValue(() => this._createInstance<T>(ctor, args, _trace));
    return <T>new Proxy(Object.create(null), {
      get(_target: T, prop: PropertyKey): any {
        return idle.getValue()[prop];
      },
      set(_target: T, p: PropertyKey, value: any): boolean {
        idle.getValue()[p] = value;
        return true;
      }
    });
  }
}
```

## Part

打开 VSCode 并新建一个窗口(默认配置下)，可以将窗口分成几大部分：

  * TitleBarPart，位于顶部
  * ActivityBarPart，位于最左侧，大部分由icon构成
  * SideBarPart，紧贴ActivityBarPart右侧
  * EditorPart，编辑器
  * PanelPart，位于编辑器下面，由Terminal等构成
  * StatusBarPart，位于最下面，显示状态、分支等
  可见，VSCode 视图由Part构成。Part是VSCode工程中的一个基础类，定义了许多抽象方法，其中，protected createContentArea(parent: HTMLElement, options?: object): HTMLElement | null 方法，使用Typescript操作DOM用来定义视图

## Part之用TypeScipt操作DOM

在 src/vs/base/browser/ui 目录下，定义了许多基础的组件，比如 SelectBox，用dom.append(container, $('.option-text')); 形式和CSS定义界面。

## Command 机制

Command 可以说是VSCode定义的另一个非常好用的概念。它可以让用户通过 Shift+Command+P选择Command然后执行，并且赋予了VSCode Extension 扩展Command的能力。Command支持插件进程和VSCode进程相互调用。

## Extension(插件)机制

软件开发中的开闭原则：开放扩展，关闭修改。Extension便是开闭原则的一个很好的实现。Chrome有插件，Cocos有插件，Hexo有插件，Webpack有插件，Gulp有插件，VSCode也有插件

VSCode 内置插件在 extension 目录下，内置插件分成两种，一种是本地内置插件，另一种是打包从Extension Markents下载的内置插件。从插件大类来看，也可以分成两种，一种是Normal Extension，可以使用VSCode API，另一种是 Debugger Extension，用于运行Debug Adapter。

## Gulp编译打包

  * 自动——gulp是一个工具箱，它可以帮助您自动化工作流中痛苦或耗时的任务。
  * 平台无关——集成于全部主要IDE中，gulp适用于 PHP, .net, node.js, Java和其他平台。
  * 强大的生态系统——使用npm模块做任何你想做的事情，超过2000个流文件转换插件
  * 简单——通过提供最小的API层，gulp易于学习和使用

VSCode打包脚本位于build目录下，在执行 gulp watch 之后，gulp会首先加载根目录的 gulpfile.js文件，进而加载 build 目录下一系列 gulp.\*.js 文件，build/gulp.\*.js 文件中定义了许多 gulp task, 各个task可以相互依赖。如果想运行VSCode，可以参考[官方文档](https://github.com/microsoft/VSCode/wiki/How-to-Contribute)

## VSCode调试架构

VSCode可以调试javascript, python, php, c各种语言，而实现这些调试基础就是DAP协议，官方对DAP的图示如下：

<img src="../assets/images/2021-6/debug-arch1.png" width="80%">

VSCode 定义了一种抽象的协议即DAP，并实现了一种通用的调试UI,VSCode使用该协议与各种语言的调试进程通信，但是，各种语言不会实现DAP协议，因此，需要一个Adapter，即Debug Adapter(DA)，DA运行在一个单独的进程里面，与调试进程通信。

如果你想调试某种语言，首先，需要先实现该语言的 Debug Adapter 并以 Debugger Extension 的形式，安装到VSCode上，关于如何实现，你可以查看[官方文档](https://code.visualstudio.com/api/extension-guides/debugger-extension)。当然大部分语言的 Debug Adapter 都已经被实现，你可以直接使用。

VSCode Github Wiki翻译
=====================

[源代码组织](https://github.com/microsoft/vscode/wiki/Source-Code-Organization)

VSCode 由一个分层的并模块化的 core(src/vs)组成，其可以使用扩展进行扩展。扩展在扩展主机的独立进程中运行。扩展是利用扩展API实现的。

## 分层

core分为以下几层：
  * base: 提供通用工具和用户界面构建区块
  * platform: 定义服务注入支持和VSCode的基本服务
  * editor: "Monaco"编辑器可以作为一个单独的可下载的组件来提供
  * workbench: 托管"Monaco"编辑器，并为"viewlet"提供框架，如浏览器、状态栏或菜单栏，利用Electron实现VSCode桌面用用程序。

## 目标环境

VSCode 的核心完全用 TypeScript 实现。在每一层中，代码由目标运行时环境组织。这确保只是用特定于运行时的API。在代码中我们区分一下目标环境:
  * common: 只需要基本的 JavaScript API并且在所有其他目标环境运行的源代码
  * browser: 需要浏览器API(如访问DOM)的源代码
    * 可能使用 common 中的代码
  * node: 需要 nodejs API的源代码
    * 可能使用 common 中的代码
  * electron-sandbox: 需要 browser API 的源代码，如访问 DOM和一小部分API来与Electron主进程通信(src/vs/base/parts/sandbox/electron-sandbox/globals.ts)
    * 可能使用 common, browser, electron-sandbox 中的代码
  * electron-browser: 需要 Electron renderer-process API的源代码
    * 可能使用 common, browser, node 中的代码
  * electron-main: 需要 Electron main-process API的源代码
    * 可能使用 common, node 中的代码

## 依赖注入

源代码是围绕服务组织的，其大多数定义在 platform 层。服务沟通过constructor injection(构造器注入)获得客户端。

服务定义由两部分组成：(1)服务的interface，和(2)服务的标识符，后者是必须的，因为 TypeScript 不使用名义类型，而是结构类型。服务标识符是一种装饰器(如 ES7 所建议的)，应该与服务接口具有相同的名称。

生命服务依赖关系是通过向构造函数参数添加相应的装饰器来实现的。在下面的代码片段中，@IModelService 是服务标识符装饰器，IModelService是此参数的(可选)类型注释。当依赖项是可选的时候，请使用 @optional装饰器，否则实例化服务将抛出错误。

```typescript
class Client {
  construtor(
    @IModelService modelService: IModelService,
    @optional(IEditorService) editorService: IEditorService
  ) {
    // use services
  }
}
```

使用实例化服务来为服务消费者创建实例，如同 instantiationService.createInstance(Client)。通过，这是在注册为发行器时完成的，比如一个 Viewlet 或者 Language

## VSCode 编辑器源代码组织

* vs/editor 目录不应该有任何 node 或 electron-browser 依赖
* vs/editor/common 和 vs/editor/browser，VSCode编辑器的核心(关键代码，没有它编辑器就没有意义)。
* vs/editor/contrib，VSCode和单独的编辑器之间提供的编辑器发行版。按照惯例，它们依赖于 browser，可以在没有它们的情况下创建编辑器，从而导致带来的功能被删除。
* vs/editor/standalone，仅与独立编辑器相关的代码，没有任何东西会依赖 vs/editor/standalone
* vs/workbench/contrib/codeEditor，VSCode里提供的代码编辑器发行版。

## Workbench Contrib

VSCode workbench(vs/workbench)由许多东西组成，以提供丰富的开发体验。例如包括全文搜索，集成git和debug。其核心，workbench并不直接依赖于所有这些发行版。相反，我们使用一个内部机制(与真正的扩展API相反)将这些发行版提供给workbench。

为 workbench 提供功能的发行版都在 vs/workbench/contrib 目录下。此目录有一些规则：

* 从 vs/workbench/contrib 外部到 vs/workbench/contrib 不能有任何依赖关系。
* 每个发行版都应该从一个文件(例如 vs/workbench/contrib/search/common/search.ts)公开其内部的API
* 一个发行版被允许依赖于另一个发行版的内部API(如git发行版可能依赖于vs/workbench/contrib/search/common/search.ts)
* 一个发行版不应该深入另一个发行版的内部(内部是发行版不在单个通用API文件里的任何内容)
* 让一个发行版依赖于另一个发行版之前，请三思：这真的必要吗？这有意义吗？使用workbench可扩展性机制可以避免依赖型吗？
