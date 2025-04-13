---
layout: post
title: Doctrine Mapping Type
date: 2018-07-04 00:00
comments: true
external-url:
categories: 日常记录
---

**Doctrine 映射类型**

- string: 字符串
- integer: 正整型
- smallint: 微整(割双眼皮之类的)
- bigint: 大整，映射到PHP字符串
- boolean: 布尔
- decimal: SQL DECIMAL映射到php字符串
- date: 日期，映射 SQL DATETIME 到PHP DateTime对象
- time: 时间，映射 SQL TIME 到 PHP DateTime 对象。
- datetime: 日期时间，映射 SQL DATETIME/TIMESTAMP 到 PHP DateTime 对象。
- datetimetz: 日期时间，映射 SQL DATETIME/TIMESTAMP 到带时间区域的 PHP DateTime 对象
- text: 文本，映射 SQL CLOB 到 PHP 字符串
- object: 对象，映射SQL CLOB 到一个使用serialize()和unserialize()的 PHP 对象。
- array: 数组，映射 SQL CLOB 到使用serialize() 和 unserialize() 的 PHP数组
- simple_array: 简单数组，映射 SQL CLOB 到使用implode() and explode()的 PHP 数组，以逗号作为分隔符。请确保你的值不包含"," 这个字符才使用这个类型。
- json_array: json数组，映射 SQL CLOB 到使用json_encode() 和 json_decode()的 PHP数组
- float: 浮点类型，映射SQL Float (双精度) 到 PHP 双精度。重要： 只在带有使用decimal points作为分隔符的locale设置下工作。
- guid: 映射数据库 GUID/UUID 到PHP字符串。默认是 varchar，但如果平台支持的话可以使用特定的类型。
- blob: 映射 SQL BLOB 到 PHP 资源流
