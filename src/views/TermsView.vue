<template>
  <div class="terms-page">
    <h1>用户协议</h1>
    <p class="muted updated">最后更新：2026 年 8 月</p>

    <section class="config-section">
      <h2 class="config-section-title">1. 服务说明</h2>
      <p class="muted">
        Fancheer 是博主个人展示站，提供作品展示、留言互动、打卡等轻量社区功能。
        注册即表示您已阅读并同意本协议。
      </p>
    </section>

    <section class="config-section">
      <h2 class="config-section-title">2. 账号与行为规范</h2>
      <ul class="terms-list muted">
        <li>请使用真实、合法的信息注册，妥善保管账号密码。</li>
        <li>不得发布违法、侵权、骚扰、广告 spam 或含有敏感词的内容。</li>
        <li>公开留言所有人可见；私密留言仅博主可见，请勿发送违法信息。</li>
        <li>平台有权删除违规内容、封禁账号，并配合必要时的法律要求。</li>
      </ul>
    </section>

    <section class="config-section">
      <h2 class="config-section-title">3. 内容与知识产权</h2>
      <p class="muted">
        您发布的留言内容，您保留相应权利，同时授予站点在展示、审核所需范围内的使用许可。
        站点展示的博主作品、图片、音乐等版权归博主或权利人所有，未经授权请勿转载。
      </p>
    </section>

    <section class="config-section">
      <h2 class="config-section-title">4. 隐私说明</h2>
      <p class="muted">
        我们会收集注册与互动所需的基本信息（如用户名、昵称、头像、留言记录），
        用于账号管理、社区互动与安全防护，不会出售您的个人信息。
      </p>
    </section>

    <section class="config-section">
      <h2 class="config-section-title">5. 免责声明</h2>
      <p class="muted">
        本站按「现状」提供服务，不对因网络、设备或第三方原因导致的服务中断承担责任。
        用户之间的互动内容不代表博主或站点的立场。
      </p>
    </section>

    <section class="config-section">
      <h2 class="config-section-title">6. 协议变更</h2>
      <p class="muted">
        我们可能适时更新本协议，更新后继续使用本站即视为接受修订内容。
        如有疑问，请通过聊天室与博主联系。
      </p>
    </section>

    <p class="back muted">
      <RouterLink to="/register">返回注册</RouterLink>
      ·
      <RouterLink to="/">返回首页</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.updated {
  margin: 0.25rem 0 1.5rem;
  font-size: 0.875rem;
}

.terms-list {
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.8;
}

.terms-list li + li {
  margin-top: 0.375rem;
}

.back {
  text-align: center;
  margin-top: 2rem;
  font-size: 0.875rem;
}

.back a {
  color: var(--accent-primary);
}
</style>
