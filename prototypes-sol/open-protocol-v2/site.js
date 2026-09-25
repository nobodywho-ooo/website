const menu = document.querySelector('.menu');
menu.hidden = false;
document.querySelector('.nav').classList.add('enhanced');
menu.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') !== 'true'));
});
document.querySelector('.nav').addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  }
});

const tablist = document.querySelector('.binding-tabs');
const tabs = [...tablist.querySelectorAll('button')];
tablist.hidden = false;
tablist.setAttribute('role', 'tablist');
function selectBinding({ selected }) {
  for (const tab of tabs) {
    const active = tab === selected;
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    panel.hidden = !active;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
  }
}
selectBinding({ selected: tabs[0] });
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectBinding({ selected: tab }));
  tab.addEventListener('keydown', (event) => {
    const targets = {
      ArrowRight: tabs[(index + 1) % tabs.length],
      ArrowLeft: tabs[(index - 1 + tabs.length) % tabs.length],
      Home: tabs[0],
      End: tabs.at(-1),
    };
    if (!targets[event.key]) return;
    event.preventDefault();
    selectBinding({ selected: targets[event.key] });
    targets[event.key].focus();
  });
}

const status = document.querySelector('.copy-status');
for (const button of document.querySelectorAll('[data-copy]')) {
  button.hidden = false;
  const label = button.textContent;
  button.addEventListener('click', async () => {
    const code = document.getElementById(button.dataset.copy);
    let copied = false;
    try {
      await navigator.clipboard.writeText(code.textContent.trim());
      copied = true;
    } catch {
      // Direct file previews may not allow the Clipboard API.
      const range = document.createRange();
      range.selectNodeContents(code);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      try { copied = document.execCommand('copy'); } catch { copied = false; }
      if (copied) selection.removeAllRanges();
    }
    button.textContent = copied ? 'Copied' : label;
    status.textContent = copied ? 'Copied to clipboard.' : 'Select the command and copy it manually.';
    window.setTimeout(() => { button.textContent = label; }, 1600);
  });
}
