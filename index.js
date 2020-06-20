const [clock] = document.getElementsByTagName('div');
const [closeButton] = document.getElementsByTagName('button');
const [input] = document.getElementsByTagName('input');


// Setup state

let customFormat = input.value = 'dddd[\\n]MMMM Do[\\n]h:mm:ss A';
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

// let formatDocsWin;

document.onkeydown = (e) => {
  if (document.activeElement === input) return;

  if (e.key === 'c') {
    e.preventDefault();
    document.body.classList.toggle('color');
    refreshClock();
  }
  else if (e.key === 'q') {
    e.preventDefault();

    input.hidden = false;
    input.focus();

    // formatDocsWin = window.open('help.html', '_blank', 'resizable=yes,menubar=yes,status=yes,modal');

    // window.focus();
    // formatDocsWin.blur();
  }
};

function refreshClock() {
  const newTime = moment().format(customFormat.replace(/\\n/g, '\n'));
  if (clock.innerText !== newTime) clock.innerText = newTime;

  fixClockSize();
}

// Custom format

input.onkeydown = (e) => {
  if (e.keyCode === 13) {
    customFormat = input.value ? input.value : null;
    input.hidden = true;
    // formatDocsWin.close();
    refreshClock();
  }
  else if (e.keyCode === 27) {
    input.value = customFormat;
    input.hidden = true;
    // formatDocsWin.close();
  }
};
