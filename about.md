---
layout: page
title: About
permalink: /about/
---

<div class="about-page">
  <div class="profile-header" style="text-align: center; margin-bottom: 50px;">
    <div class="avatar" style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; margin: 0 auto 20px; border: 4px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <img src="{{ "/assets/images/dog215.png" | prepend: site.baseurl }}" alt="TonyG" style="width: 100%; height: 100%; object-fit: cover;">
    </div>
    <h1 style="font-size: 2.5em; font-weight: 800; margin-bottom: 10px;">TonyG</h1>
    <p style="font-size: 1.2em; color: #666; font-style: italic;">热爱、生活、关于。</p>
  </div>

  <div class="about-content" style="max-width: 700px; margin: 0 auto; line-height: 1.8; color: #444; font-size: 1.1em;">
    <p>你好，我是 TonyG。这里是我的个人博客，记录我的技术探索和生活感悟。</p>
    
    <hr style="margin: 40px 0; border: 0; border-top: 1px dashed #ccc;">
    
    <h3>关于本站</h3>
    <p>这个博客主题模仿了老式针式打印机的出纸效果。每一篇文章，都像是一张刚刚打印出来的纸条，承载着思想的温度。</p>
    
    <h3>联系方式</h3>
    <ul style="list-style: none; padding: 0;">
      <li style="margin-bottom: 10px;">
        <span style="display: inline-block; width: 24px;">✉</span> 
        <a href="mailto:linuxertony@163.com" style="color: #333; text-decoration: none; border-bottom: 1px solid #ddd;">linuxertony@163.com</a>
      </li>
      {% if site.github_username %}
      <li style="margin-bottom: 10px;">
        <span style="display: inline-block; width: 24px;">○</span>
        <a href="https://github.com/{{ site.github_username }}" style="color: #333; text-decoration: none; border-bottom: 1px solid #ddd;">GitHub</a>
      </li>
      {% endif %}
    </ul>
  </div>
</div>
