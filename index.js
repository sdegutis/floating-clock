const [clock] = document.getElementsByTagName('div');
const [closeButton] = document.getElementsByTagName('button');
const [input] = document.getElementsByTagName('input');


// Setup state

input.value = localStorage.getItem('format') ?? '[dddd]\\n[MMMM Do]\\n[h:mm:ss A]';
let oldText;
let formatter;
reformat();

let size = 24;

setupWindowsButtonColor();
refreshClock();
setInterval(refreshClock, 1000);
fixClockSize();


// Close button

closeButton.onclick = () => window.close();

window.onblur = () => {
  closeButton.hidden = true;
};

window.onfocus = () => {
  setTimeout(() => {
    closeButton.hidden = false;
  }, 0);
};

function setupWindowsButtonColor() {
  const color = new URLSearchParams(location.search).get('color');
  const style = document.createElement('style');
  style.nonce = 'clock';
  style.innerHTML = `button:hover { background: #${color} }`;
  document.documentElement.append(style);
}


// Drag to move

document.onmousedown = (e) => {
  if (e.target === closeButton || e.target === input) return;
  e.preventDefault();

  document.onmousemove = (e) => {
    e.preventDefault();
    window.moveBy(e.movementX, e.movementY);
  };

  document.onmouseup = (e) => {
    e.preventDefault();
    document.onmousemove = null;
    document.onmouseup = null;
  };
};


// Scroll to resize

document.onmousewheel = (e) => {
  const by = (e.deltaY > 0 ? -1 : 1) * 2;
  size += by;
  size = Math.max(size, 11);
  fixClockSize();
};


// Auto sizing

function fixClockSize() {
  clock.style.fontSize = size + 'pt';
  const rect = clock.getBoundingClientRect();

  const newWidth = Math.max(100, rect.width + 2);
  const newHeight = Math.max(100, rect.height + 2);

  const diffX = window.innerWidth - newWidth;
  const diffY = window.innerHeight - newHeight;

  window.resizeTo(newWidth, newHeight);
  window.moveBy(diffX / 2, diffY / 2);
}


// Display

document.onkeydown = (e) => {
  if (document.activeElement !== input) {
    if (e.key === 'c') {
      e.preventDefault();
      document.body.classList.toggle('color');
      refreshClock();
    }
  }

  if (e.keyCode === 27) {
    // Escape hides/shows the format field
    if (input.hidden) {
      input.hidden = false;
      input.focus();
    }
    else {
      input.hidden = true;
      refreshClock();
    }
  }
};

function refreshClock() {
  const newTime = formatter();
  if (oldText !== newTime) {
    oldText = newTime;
    clock.innerHTML = newTime;

    // for (const el of clock.getElementsByTagName('span')) {
    //   el.style.color = el.dataset['color'];
    // }
  }

  fixClockSize();
}

function reformat() {
  const str = input.value;
  let format = str.split(/[\[\]]/).map((item, i) => (i % 2 === 1) ? item : item === '' ? '' : `[${item}]`).join('').replace(/\\n/g, '\n');

  format = format.replace('Happy Birthday, David!', '<span class="rainbow-text">$&</span>');
  format = format.replace(/\n/g, '<br>');

  formatter = () => {
    return moment().format(format);
  };

}

input.oninput = () => {
  localStorage.setItem('format', input.value);
  reformat();
  refreshClock();
};
