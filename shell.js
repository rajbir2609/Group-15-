const { listApps, subscribeToApps } = window.LumenApps;

const desktopIcons = document.querySelector('#desktop-icons');
const windowLayer = document.querySelector('#window-layer');
const taskList = document.querySelector('#task-list');
const template = document.querySelector('#window-template');
const openWindows = new Map();
let zIndex = 10;
let cascadeOffset = 0;

function focusWindow(appId) {
  const record = openWindows.get(appId);
  if (!record) return;
  record.window.classList.remove('minimized');
  record.window.style.zIndex = ++zIndex;
  document.querySelectorAll('.os-window').forEach((window) => window.classList.remove('focused'));
  record.window.classList.add('focused');
  taskList.querySelectorAll('.task-button').forEach((button) => button.classList.toggle('active', button.dataset.appId === appId));
}

function closeWindow(appId) {
  const record = openWindows.get(appId);
  if (!record) return;
  record.window.remove();
  record.task.remove();
  openWindows.delete(appId);
}

function minimizeWindow(appId) {
  const record = openWindows.get(appId);
  if (!record) return;
  record.window.classList.add('minimized');
  record.task.classList.remove('active');
}

function enableDragging(window, titlebar) {
  titlebar.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    const bounds = window.getBoundingClientRect();
    const offsetX = event.clientX - bounds.left;
    const offsetY = event.clientY - bounds.top;
    focusWindow(window.dataset.appId);
    titlebar.setPointerCapture(event.pointerId);
    const drag = (moveEvent) => {
      const maxX = Math.max(0, windowLayer.clientWidth - window.offsetWidth);
      const maxY = Math.max(0, windowLayer.clientHeight - window.offsetHeight);
      window.style.left = `${Math.min(maxX, Math.max(0, moveEvent.clientX - offsetX))}px`;
      window.style.top = `${Math.min(maxY, Math.max(0, moveEvent.clientY - offsetY))}px`;
    };
    titlebar.addEventListener('pointermove', drag);
    titlebar.addEventListener('pointerup', () => titlebar.removeEventListener('pointermove', drag), { once: true });
  });
}

function openApp(app) {
  if (openWindows.has(app.id)) return focusWindow(app.id);
  const fragment = template.content.cloneNode(true);
  const window = fragment.querySelector('.os-window');
  window.dataset.appId = app.id;
  window.style.left = `${Math.min(90 + cascadeOffset, Math.max(12, windowLayer.clientWidth - 330))}px`;
  window.style.top = `${Math.min(64 + cascadeOffset, Math.max(12, windowLayer.clientHeight - 230))}px`;
  cascadeOffset = (cascadeOffset + 26) % 150;
  window.querySelector('.window-title').textContent = `${app.icon}  ${app.name}`;
  const content = window.querySelector('.window-content');
  const rendered = app.component();
  if (rendered instanceof Node) content.append(rendered);
  else content.innerHTML = rendered;
  window.querySelector('.window-close').addEventListener('click', () => closeWindow(app.id));
  window.querySelector('.window-minimize').addEventListener('click', () => minimizeWindow(app.id));
  window.addEventListener('pointerdown', () => focusWindow(app.id));
  enableDragging(window, window.querySelector('.window-titlebar'));
  windowLayer.append(window);

  const task = document.createElement('button');
  task.className = 'task-button';
  task.type = 'button';
  task.dataset.appId = app.id;
  task.textContent = `${app.icon} ${app.name}`;
  task.addEventListener('click', () => window.classList.contains('minimized') ? focusWindow(app.id) : minimizeWindow(app.id));
  taskList.append(task);
  openWindows.set(app.id, { window, task });
  focusWindow(app.id);
}

function renderIcons(apps) {
  desktopIcons.replaceChildren();
  apps.forEach((app) => {
    const icon = document.createElement('button');
    icon.className = 'app-icon';
    icon.type = 'button';
    icon.innerHTML = `<span class="app-icon-symbol">${app.icon}</span><span class="app-icon-label">${app.name}</span>`;
    icon.addEventListener('click', () => openApp(app));
    desktopIcons.append(icon);
  });
}

function updateClock() {
  document.querySelector('#clock').textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
}

document.querySelector('#start-button').addEventListener('click', () => window.alert('LUMEN OS v1.0\nGermany Launch Decision Cockpit\nChoose an app from the desktop.'));
subscribeToApps(renderIcons);
renderIcons(listApps());
updateClock();
setInterval(updateClock, 30_000);
setTimeout(() => document.querySelector('#boot-screen').classList.add('booted'), 2600);
