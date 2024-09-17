let buttons = document.querySelectorAll(".call-lift-btn");
const addLiftBtn = document.querySelector(".add-lift-btn");
const addFloorBtn = document.querySelector(".add-floor-btn");
let liftEls = document.querySelectorAll(".lift-container");
let leftDoors = document.querySelectorAll(".left-door");
let rightDoors = document.querySelectorAll(".right-door");
const floorsContainer = document.querySelector(".floors");
let floors = document.querySelectorAll(".floor");

class Queue {
  constructor() {
    this.items = [];
  }

  enqueue(element) {
    return this.items.push(element);
  }

  dequeue() {
    if (this.items.length > 0) {
      return this.items.shift();
    }
  }

  peek() {
    return this.items[0]; // Updated to peek the first element
  }

  isEmpty() {
    return this.items.length == 0;
  }

  size() {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }
}

// Track active requests to avoid duplicate dispatches
let activeRequests = new Set();

/**
 *
 *    LIFT Management
 *    - get lifts
 *    - get empty lift
 *    - add lift
 *
 */

const lifts = Array.from(document.querySelectorAll(".lift-container"), (el) => ({
  htmlEl: el,
  busy: false,
  currFloor: 0,
}));

function getLifts() {
  return lifts;
}

function getClosestEmptyLift(destFloor) {
  const lifts = getLifts();

  const emptyLifts = lifts.reduce(
    (result, value, i) =>
      result.concat(
        value.busy === false
          ? {
              i,
              currFloor: value.currFloor,
              distance: Math.abs(destFloor - value.currFloor),
            }
          : []
      ),
    []
  );

  if (emptyLifts.length <= 0) {
    return { lift: {}, index: -1 };
  }

  const closestLift = emptyLifts.reduce((result, value, index) =>
    value.distance < result.distance ? value : result
  );

  const index = closestLift.i;

  return { lift: lifts[index], index };
}

const getMaxLifts = () => {
  const viewportwidth = document.getElementsByTagName("body")[0].clientWidth;
  return Math.floor(((viewportwidth - 100) / 120));
};

const callLift = () => {
  const destFloor = requests.peek();
  const liftAtDestination = lifts.some(lift => lift.currFloor === destFloor);
  if (activeRequests.has(destFloor || liftAtDestination)) {
    // Don't dispatch a lift if one is already going to the requested floor
    return;
  }

  const { lift, index } = getClosestEmptyLift(destFloor);

  if (index >= 0) {
    lifts[index].busy = true;
    activeRequests.add(destFloor); // Mark the floor as being served
    moveLift(lift.htmlEl, requests.dequeue(), index);
  }
};

/**
 *
 *    LIFT ACTIONS -> animations
 *    open, close, move up, down.
 *
 */
const openLift = (index) => {
  buttons.disabled = true;
  
  rightDoors[index].classList.remove("right-door-close");
  leftDoors[index].classList.remove("left-door-close");
  rightDoors[index].classList.add("right-door-open");
  leftDoors[index].classList.add("left-door-open");
};

const closeLift = (index) => {
  
  rightDoors[index].classList.remove("right-door-open");
  leftDoors[index].classList.remove("left-door-open");
  rightDoors[index].classList.add("right-door-close");
  leftDoors[index].classList.add("left-door-close");

  buttons.disabled = false;

  setTimeout(() => {
    lifts[index].busy = false;
    activeRequests.delete(lifts[index].currFloor); // Remove the floor from active requests
    dispatchliftIdle();
  }, 2500);
};


const openCloseLift = (index) => {
  openLift(index);
  setTimeout(() => {
    closeLift(index);
  }, 3000);
};

const moveLift = (lift, destFloor, index) => {
  const distance = Math.abs(destFloor - lifts[index].currFloor);
  lift.style.transform = `translateY(${destFloor * 100 * -1}%)`;
  lift.style.transition = `transform ${1500 * distance}ms ease-in-out`;

  setTimeout(() => {
    openCloseLift(index);
  }, distance * 1500 + 1000);

  lifts[index].currFloor = destFloor;
};

/**
 *
 *    REQUESTS:
 *    addRequest
 *    removeRequest
 *
 */

function addRequest(destFloor) {
  // Only add the request if it's not already in the queue and not being served
  if (!activeRequests.has(destFloor)) {
    requests.enqueue(destFloor);
    dispatchRequestAdded();
  }
}

function removeRequest() {
  requests.dequeue();
}

/**
 *
 *      EVENTS:
 *      requestAddedEvent
 *      liftIdleEvent
 *
 */

const requestAddedEvent = new Event("requestAdded");
const liftIdleEvent = new Event("liftIdle");

function dispatchRequestAdded() {
  document.dispatchEvent(requestAddedEvent);
}

function dispatchliftIdle() {
  document.dispatchEvent(liftIdleEvent);
}

document.addEventListener("requestAdded", () => {
  callLift();
});

document.addEventListener("liftIdle", () => {
  if (!requests.isEmpty()) {
    callLift();
  }
});

/**
 *
 *    ADD DOM Elements
 *    - addLift
 *    - addFloor
 *
 */

function addLift() {
  floors[floors.length - 1].append(getLiftEl());
  liftEls = document.querySelectorAll(".lift-container");
  lifts.push({
    htmlEl: liftEls[liftEls.length - 1],
    busy: false,
    currFloor: 0,
  });
  leftDoors = document.querySelectorAll(".left-door");
  rightDoors = document.querySelectorAll(".right-door");

  // if (lifts.length >= getMaxLifts()) {
  //   console.log("Max lifts added");
  //   addLiftBtn.disabled = true;
  //   addLiftBtn.textContent = "Max lifts added";
  //   return;
  // }
}

function getLiftEl() {
  const liftDistance = (lifts.length + 1) * 120;

  const liftEL = document.createElement("div");
  liftEL.classList.add("lift-container");
  liftEL.style.position = "absolute";
  liftEL.style.left = `${liftDistance}px`;

  liftEL.innerHTML += `
            <div class="left-door">
            </div>
            <div class="right-door">
            </div>
        `;

  return liftEL;
}

function addFloor() {
  floorsContainer.prepend(getFloorEl());
  floors = document.querySelectorAll(".floor");
  buttons = document.querySelectorAll(".call-lift-btn");
  addCallLiftListeners([buttons[0], buttons[1]]);
}

function getFloorEl() {
  const newLiftNum = floors.length;

  const floorEl = document.createElement("div");
  floorEl.classList.add("floor");
  floorEl.innerHTML += `
                  <div class="lift-buttons">
                      <button class="call-lift-btn open-lift-btn" data-lift-num="${newLiftNum}">
                          <i class="fa-solid fa-angle-up"></i>
                      </button>
                      <button class="call-lift-btn close-lift-btn" data-lift-num="${newLiftNum}">
                          <i class="fa-solid fa-angle-down"></i>
                      </button>
                  </div>
                `;
  return floorEl;
}

function addCallLiftListeners(buttons) {
  for (let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", () => {
      addRequest(buttons[i].dataset.liftNum);
    });
  }
}

let requests = new Queue();

document.querySelector("form").addEventListener("submit", (e) => {
  e.preventDefault();
  // const { numLifts, numFloors } = e.target.elements;
  // console.log(numLifts, numFloors);
  const numLifts = document.getElementById("num-lifts").value;  // Get number of lifts
  const numFloors = document.getElementById("num-floors").value; 
  console.log(numLifts, numFloors);
  document.querySelector(".screen1").remove();
  document.querySelector(".screen2").style.display = "block";

  for (let i = 0; i < numFloors - 1; i++) {
    addFloor();
  }

  for (let i = 0; i < numLifts - 1; i++) {
    addLift();
  }
});

function main() {
  addCallLiftListeners(buttons);
  addFloorBtn.addEventListener("click", addFloor);
  addLiftBtn.addEventListener("click", addLift);
}

main();
