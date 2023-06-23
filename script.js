//Initial references
let container = document.querySelector(".container");
let dialog = document.getElementById("dialog");
let gridButton = document.getElementById("submit-grid");
let clearGridButton = document.getElementById("clear-grid");
let resetGridButton = document.getElementById("reset-grid");
let gridWidth = document.getElementById("width-range");
let gridHeight = document.getElementById("height-range");
let eraseBtn = document.getElementById("erase-btn");
let paintBtn = document.getElementById("paint-btn");
let widthValue = document.getElementById("width-range");
let heightValue = document.getElementById("height-range");
let importButton = document.getElementById("upload-image-btn");
let saveButton = document.getElementById("save-image-btn");
//Events object
let events = {
  mouse: {
    down: "mousedown",
    move: "mousemove",
    up: "mouseup",
  },
  touch: {
    down: "touchstart",
    move: "touchmove",
    up: "touchend",
  },
};
let deviceType = "";
//Initially draw and erase would be false
let draw = false;
let erase = false;
let selected_color = {0: 0, 1: 0};
let current_color = {0: 0, 1: 0};

let grid_width = 0;
let grid_height = 0;

const hshift = (array, index) => array.map(a => [...a.slice(index), ...a.slice(0, index)]);
const vshift = (array, index) => array.map(a => [...a.slice(index), ...a.slice(0, index)]);

const reader = new FileReader();


let colors = [[[255, 192, 192], [255, 0, 0], [192, 0, 0]],
              [[255, 255, 192], [255, 255, 0], [192, 192, 0]],
              [[192, 255, 192], [0, 255, 0], [0, 192, 0]],
              [[192, 255, 255], [0, 255, 255], [0, 192, 192]],
              [[192, 192, 255], [0, 0, 255], [0, 0, 192]],
              [[255, 192, 255], [255, 0, 255], [192, 0, 192]],
              [[255, 255, 255], [0, 0, 0]]
             ]

let color_strings = {
    0: {0: "*", 1: "push", 2: "pop"},
    1: {0: "add", 1: "sub", 2: "mult"},
    2: {0: "div", 1: "mod", 2: "not"},
    3: {0: "great", 1: "point", 2: "switch"},
    4: {0: "dup", 1: "roll", 2: "in(n)"},
    5: {0: "in(c)", 1: "out(n)", 2: "out(c)"}
}

window.onload = () => {
  gridWidth.value = 10;
  gridHeight.value = 10;

  buttons = document.getElementsByClassName('colorbutton');

  resetGridButton.addEventListener("click", () => show_dialog());

  importButton.addEventListener("click", () => begin_import());
  saveButton.addEventListener("click", () => begin_save());


  for (var p = 0; p < 20; p++) {
    (function(p) {
      buttons[p].style.backgroundColor= 'rgb(' + colors[Math.floor(p/3)][p%3].join(',') + ')';
      buttons[p].addEventListener("click", () => shift_words(Math.floor(p/3), (p % 3)));
    }(p));
  }

  shift_words(0, 0);


};

//Detect touch device
const isTouchDevice = () => {
  try {
    //We try to create TouchEvent(it would fail for desktops and throw error)
    document.createEvent("TouchEvent");
    deviceType = "touch";
    return true;
  } catch (e) {
    deviceType = "mouse";
    return false;
  }
};
isTouchDevice();

function show_dialog(element) {
  dialog.className = 'dialog';
  dialog.showModal();
}

//On Press, create grid
gridButton.addEventListener("click", () => create_grid());

function create_grid(element, file=null) {
  dialog.className = '';
  dialog.close();

  if (grid_width == 0 & grid_height == 0 & file == null) {
    grid_width = gridWidth.value;
    grid_height = gridHeight.value;
  //Initially clear the grid (old grids cleared)
    container.innerHTML = "";
    //count variable for generating unique ids
    let count = 0;
    //loop for creating rows
    for (let i = 0; i < gridHeight.value; i++) {
      //incrementing count by 2
      count += 2;
      //Create row div
      let div = document.createElement("div");
      div.classList.add("gridRow");
      //Create Columns
      for (let j = 0; j < gridWidth.value; j++) {
        count += 2;
        let col = document.createElement("div");
        col.classList.add("gridCol");
        /* We need unique ids for all columns (for touch screen specifically) */
        col.setAttribute("id", `gridCol${count}`);
        col.style.backgroundColor = "rgb(255, 255, 255)"
        /*
        For eg if deviceType = "mouse"
        the statement for the event would be events[mouse].down which equals to mousedown
        if deviceType="touch"
        the statement for event would be events[touch].down which equals to touchstart
         */
        col.addEventListener(events[deviceType].down, () => {
          //user starts drawing
          draw = true;
          //if erase = true then background = transparent else color
          if (erase) {
            col.style.backgroundColor = "rgb(255, 255, 255)";
          } else {
            col.style.backgroundColor = 'rgb(' + colors[selected_color[0]][selected_color[1]].join(',') + ')';
            col.style.border = '1px solid rgb(' + colors[selected_color[0]][selected_color[1]].join(',') + ')';
          }
        });
        col.addEventListener(events[deviceType].move, (e) => {
          /* elementFromPoint returns the element at x,y position of mouse */
          let elementId = document.elementFromPoint(
            !isTouchDevice() ? e.clientX : e.touches[0].clientX,
            !isTouchDevice() ? e.clientY : e.touches[0].clientY
          ).id;
          //checker
          //console.log(colors[selected_color[0]][selected_color[1]]);
          checker(elementId);
        });
        //Stop drawing
        col.addEventListener(events[deviceType].up, () => {
          draw = false;
        });
        //append columns
        div.appendChild(col);
      }
      //append grid to container
      container.appendChild(div);
    }
  } else if (file) {
    container.innerHTML = "";
    //count variable for generating unique ids
    let count = 0;
    //loop for creating rows
    for (let i = 0; i < gridHeight.value; i++) {
      //incrementing count by 2
      count += 2;
      //Create row div
      let div = document.createElement("div");
      div.classList.add("gridRow");
      //Create Columns
      for (let j = 0; j < gridWidth.value; j++) {
        count += 2;
        let col = document.createElement("div");
        col.classList.add("gridCol");
        /* We need unique ids for all columns (for touch screen specifically) */
        col.setAttribute("id", `gridCol${count}`);
        let color = getPixelXY(file, j, i);
        col.style.backgroundColor = 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
        col.style.border = '1px solid rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
        /*
        For eg if deviceType = "mouse"
        the statement for the event would be events[mouse].down which equals to mousedown
        if deviceType="touch"
        the statement for event would be events[touch].down which equals to touchstart
         */
        col.addEventListener(events[deviceType].down, () => {
          //user starts drawing
          draw = true;
          //if erase = true then background = transparent else color
          if (erase) {
            col.style.backgroundColor = "rgb(255, 255, 255)";
          } else {
            col.style.backgroundColor = 'rgb(' + colors[selected_color[0]][selected_color[1]].join(',') + ')';
            col.style.border = '1px solid rgb(' + colors[selected_color[0]][selected_color[1]].join(',') + ')';
          }
        });
        col.addEventListener(events[deviceType].move, (e) => {
          /* elementFromPoint returns the element at x,y position of mouse */
          let elementId = document.elementFromPoint(
            !isTouchDevice() ? e.clientX : e.touches[0].clientX,
            !isTouchDevice() ? e.clientY : e.touches[0].clientY
          ).id;
          //checker
          //console.log(colors[selected_color[0]][selected_color[1]]);
          checker(elementId);
        });
        //Stop drawing
        col.addEventListener(events[deviceType].up, () => {
          draw = false;
        });
        //append columns
        div.appendChild(col);
      }
      //append grid to container
      container.appendChild(div);
    }
  }
}
function checker(elementId) {
  let gridColumns = document.querySelectorAll(".gridCol");
  //loop through all boxes
  gridColumns.forEach((element) => {
    //if id matches then color
    if (elementId == element.id) {
      if (draw && !erase) {
        element.style.backgroundColor = 'rgb(' + colors[selected_color[0]][selected_color[1]].join(',') + ')';
        element.style.border = '1px solid rgb(' + colors[selected_color[0]][selected_color[1]].join(',') + ')';
      } else if (draw && erase) {
        element.style.backgroundColor = "rbg(255, 255, 255)";
        element.style.border = '1px solid #ddd';
      }
    }
  });
}

function shift_words(row_index, column_index) {
  selected_color[0] = row_index;
  selected_color[1] = column_index;

  
  let dy = selected_color[0] - current_color[0];
  let dx = selected_color[1] - current_color[1];

  if (dx < 0) {
    dx = 3 + dx;
  }

  if (dy < 0) {
    dy = 6 + dy;
  }
  buttons = document.getElementsByClassName('colorbutton');

  if (row_index != 6) {
      color_strings = shift_array(dx, dy, color_strings);
      for (let z = 0; z<18; z++) {
        buttons[z].innerHTML = color_strings[Math.floor(z/3)][z%3];
      }

      current_color[0] = row_index;
      current_color[1] = column_index;

  }
}

function shift_array (dx, dy, arr) 
   {
   let newArr = [[],[],[],
               [],[],[],
               [],[],[],
               [],[],[],
               [],[],[],
               [],[],[]];

   let numRows = 6;
   let numCols = 3;
   for(let r = 0; r < numRows; r++)
   {
      for(let c = 0; c < numCols; c++)
         newArr[(r + dy) % numRows][(c + dx) % numCols] = arr[r][c];
   }
   for(let r = 0; r < numRows; r++)
   {
      for(let c = 0; c < numCols; c++)
         arr[r][c] = newArr[r][c];
   }

   return arr;
}

function begin_save(element) {
  var rows = container.getElementsByClassName('gridRow');

  var canvas = document.createElement('canvas');
  canvas.width = grid_width; canvas.height = grid_height;

  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var idt = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (var r = 0; r < canvas.height; r++) {
    let cells = rows.item(r).getElementsByTagName('div');
    for (var c = 0; c < canvas.width; c++) {
      let rgb = cells.item(c).style.backgroundColor;
      rgb = rgb.replace(/[^\d,]/g, '').split(',');
      setPixelXY(idt, c, r, rgb[0], rgb[1], rgb[2], 255);
    }
  }

  ctx.putImageData(idt, 0, 0);
  let dataURL = canvas.toDataURL("testimage/png");

  let newTab = window.open('about:blank','image from canvas');
  newTab.document.write("<img src='" + dataURL + "' alt=from canvas'/>");
}

function begin_import(element) {
  document.getElementById('attachment').click();

  const fileUpload = document.querySelector('input');
  const reader = new FileReader();
  fileUpload.addEventListener('change', () => {
    reader.readAsDataURL(fileUpload.files[0]);
    reader.onload = (e) => {
      const image = new Image();
      image.src = e.target.result;
      image.onload = () => {
        const {
          height,
          width
        } = image;
        if (height > 300 & width > 300) {
          alert("Height and Width must not exceed 300px.");
        }
        else {
          grid_width = 0; grid_height = 0;
          gridWidth.value = width;
          gridHeight.value = height;

          var canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;

          var ctx = canvas.getContext("2d");
          ctx.drawImage(image, 0, 0);
          var idt = ctx.getImageData(0, 0, canvas.width, canvas.height);

          create_grid(image, file=idt);
        }
      };
    };
  });
}

function getPixel(imgData, index) {
  var i = index*4, d = imgData.data;
  return [d[i],d[i+1],d[i+2],d[i+3]] // [R,G,B,A]
}

function getPixelXY(imgData, x, y) {
  return getPixel(imgData, y*imgData.width+x, 255);
}

function setPixel(imgData, index, r, g, b, a) {
  var i = index*4, d = imgData.data;
  d[i]   = r;
  d[i+1] = g;
  d[i+2] = b;
  d[i+3] = a;
}

function setPixelXY(imgData, x, y, r, g, b, a) {
  return setPixel(imgData, y*imgData.width+x, r, g, b, a);
}

//Clear Grid
clearGridButton.addEventListener("click", () => {
  grid_width = 0;
  grid_height = 0;
  container.innerHTML = "";
  create_grid();
});
//Erase Button
eraseBtn.addEventListener("click", () => {
  erase = true;
});
//Paint button
paintBtn.addEventListener("click", () => {
  erase = false;
});
