<template>
  <div class="profile-card" role="region" aria-label="个人信息">
    <div class="profile-body">
      <div class="top-row">
        <img class="avatar" src="/avatar.jpg" alt="Nicolette86132 头像" />
        <div class="name">Nicolette86132</div>
      </div>
      <div class="icon-row" aria-hidden="false">
        <a class="icon" href="mailto:yiboxiaotian@nuaa.edu.cn" aria-label="Email">
          <img class="icon-img" src="https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/icons/mail.svg"
            alt="Email" />
        </a>
        <a class="icon" href="https://github.com/Ebotian" target="_blank" rel="noopener" aria-label="GitHub">
          <img class="icon-img" src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/github.svg" alt="GitHub" />
        </a>
        <a class="icon" href="https://x.com/AsilenA123" target="_blank" rel="noopener" aria-label="Twitter">
          <img class="icon-img" src="https://cdn.jsdelivr.net/npm/simple-icons@v8/icons/twitter.svg" alt="Twitter" />
        </a>
        <a class="icon" href="https://music.163.com/#/user/home?id=351729969" target="_blank" rel="noopener"
          aria-label="Music">
          <img class="icon-img" src="https://cdn.jsdelivr.net/npm/feather-icons@4.28.0/dist/icons/music.svg"
            alt="Music" />
        </a>
        <a class="friend-link" href="https://ebotian-blog.vercel.app/friends" title="友链" aria-label="友链按钮">友链</a>
      </div>
      <div class="skills">
        <span class="chip">TS</span>
        <span class="chip">JS</span>
        <span class="chip">VUE</span>
        <span class="chip">TSX</span>
        <span class="chip">MYSQL</span>
        <span class="chip">VHDL</span>
        <span class="chip">VERILOG</span>
        <span class="chip">C</span>
        <span class="chip">CPP</span>
        <span class="chip">ESP/STM32</span>
        <span class="chip">LATEX</span>
        <span class="chip">PYTHON</span>
        <span class="chip">LINUX</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// purely presentational; no state needed
</script>

<style scoped>
.profile-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: transparent;
  border: none;
  box-shadow: none;
  color: inherit;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  border: 1px solid #b0d5df;
  object-fit: cover;
  flex: 0 0 auto;
}

.profile-body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.top-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.name {
  font-weight: 600;
  font-size: 0.98rem;
}

.links {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.85rem;
}

.icon-row {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-top: 0.15rem;
}

.icon-row .icon,
.icon-row .friend-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: transparent;
  text-decoration: none;
  color: inherit;
}

.icon-row .icon svg,
.icon-row .friend-btn svg {
  display: block;
}

.icon-img {
  width: 25px;
  height: 25px;
  display: block;
}

.icon {
  transition: background-color 0.2s ease, color 0.2s ease;
}

.name {
  color: #6c9bca;
  font-weight: 600;
  font-size: 0.98rem;
}

.friend-link {
  text-decoration: underline;
  color: #12aa9c;
  font-size: 0.9rem;
  align-self: center;
  padding: 0 6px;
}

.links .friend-btn {
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
}

.links .icon {
  text-decoration: none;
  color: rgba(35, 118, 183, 0.95);
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.chip {
  font-size: 0.72rem;
  padding: 0.18rem 0.45rem;
  border-radius: 999px;
  background: rgba(35, 118, 183, 0.06);
  color: rgba(35, 118, 183, 0.95);
}
</style>