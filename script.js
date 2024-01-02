"use strict";

const form = document.querySelector(".journal__form");
const date = document.querySelector(".form__input__date");
const text = document.querySelector(".form__input__text");
const containerForm = document.querySelector(".form__list");
const menu = document.querySelector(".menu");
const sortBtn = document.querySelector(".btn__sort");
const clearBtn = document.querySelector(".btn__clear");

class Memoir {
  id = Date.now() + "".slice(-10);

  constructor(coords, date, text) {
    this.coords = coords;
    this.date = date;
    this.text = text;
  }
}

class App {
  #map;
  #mapEvent;
  #list = [];
  #editMenuBtn = document.addEventListener("DOMContentLoaded", () => {
    this.#editMenuBtn = document.querySelector(".edit__menu");
  });
  #toggleBtn = document.addEventListener("DOMContentLoaded", () => {
    this.#toggleBtn = document.querySelector(".btn__toggle");
  });

  constructor() {
    this._getPosition();
    this._getLocalStorage();

    // event listner
    form.addEventListener("submit", this._newMemo.bind(this));
    form.addEventListener("click", this._clearInput.bind(this));
    containerForm.addEventListener("click", this._moveToPopup.bind(this));
    containerForm.addEventListener("click", this._deleteMemoList.bind(this));
    containerForm.addEventListener("click", this._editMemolist.bind(this));
    containerForm.addEventListener("click", this._showToggleMenu.bind(this));
    containerForm.addEventListener("click", this._hiddenToggleMenu.bind(this));
    menu.addEventListener("click", this._sortByDate.bind(this));
    menu.addEventListener("click", this._clearAll.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("something wrong with your location");
        },
        { enableHighAccuracy: false }
      );
  }

  _loadMap(position = [-27.470125, 153.021072]) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [-27.470125, 153.021072];
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      ext: "png",
    }).addTo(this.#map);

    // spinner??
    const callBack = function () {
      alert("Your Mapmoir is ready!✨ Click the map and start your Mapmoir.");
    };

    this.#map.whenReady(callBack);

    this.#map.on("click", this._showForm.bind(this));
    this.#list.forEach((work) => this._renderMarker(work));
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    menu.classList.remove("hidden");
  }

  _hideForm() {
    date.value = text.value = "";
    form.classList.add("hidden");
  }

  _clearInput(e) {
    if (e.target.classList.contains("btn__clear")) {
      // Clear the form inputs
      date.value = "";
      text.value = "";
    }
  }
  _newMemo(e) {
    e.preventDefault();
    const { lat, lng } = this.#mapEvent.latlng;
    // get value from the from
    const savedDate = date.value;
    const savedText = text.value;

    // create new object using the data from the form
    const memo = new Memoir([lat, lng], savedDate, savedText);
    this.#list.push(memo);
    // render marker on the map
    this._renderMarker(memo);
    this._renderMemoList(memo);
    // hidden from and clear the form
    this._hideForm();
    this._setLocalStorage();
  }

  _renderMarker(memo) {
    L.marker(memo.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: "journal-popup",
        })
      )
      .setPopupContent(`Your Memoir✨`)
      .openPopup();
  }

  _renderMemoList(memo) {
    let html = `
    <li class="journal__list" data-id="${memo.id}">
    <div class="journal__title">
      <h2 class="journal__list--date">${memo.date}</h2>
      <div class="toggle__menu" data-id="${memo.id}">
      <span class="btn__toggle"><i class="fa fa-ellipsis-h"></i></span>
      <div class="edit__menu hidden">
      <span class="btn__edit" data-id="${memo.id}">EDIT</span>
      <span class="btn__delete" data-id="${memo.id}">/ DELETE</span>
      </div>
      </div>
      </div>
    <div class="journal__list--details">${memo.text}</div>
  </li>
  `;
    form.insertAdjacentHTML("afterend", html);
  }

  _showToggleMenu(e) {
    const toggle = e.target.closest(".toggle__menu");
    if (toggle) {
      const editMenu = toggle.querySelector(".edit__menu");
      const editBtn = toggle.querySelector(".btn__toggle");
      editMenu.classList.toggle("hidden");
      editBtn.classList.toggle("hidden");
    }
  }
  _hiddenToggleMenu(e) {
    const toggle = e.target.closest(".toggle__menu");
    if (toggle === null && this.#editMenuBtn !== null) {
      this.#editMenuBtn.classList.add("hidden");
      this.#toggleBtn.classList.remove("hidden");
    }
  }

  _deleteMemoList(e) {
    // click the delete
    const deleteEl = e.target.closest(".toggle__menu");
    if (e.target.classList.contains("btn__delete")) {
      // console.log(e);
      // console.log(deleteEl);
      // if (!deleteEl) return;

      const updatedList = this.#list.filter(
        (item) => item.id !== deleteEl.dataset.id
      );

      //update list after delete the memo
      this.#list = updatedList;
      //update local storage
      this._setLocalStorage();
      // check if there is better way reload whole page?
      location.reload();
    }
  }

  _editMemolist(e) {
    const editEl = e.target.closest(".toggle__menu");
    if (e.target.classList.contains("btn__edit")) {
      const selectedItem = this.#list.find(
        (item) => item.id === editEl.dataset.id
      );
      this._showForm();
      text.value = selectedItem.text;
      date.value = selectedItem.date;
      //update item
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const [lat, lng] = selectedItem.coords;
        // get value from the from
        const savedDate = date.value;
        const savedText = text.value;

        // create new object using the data from the form
        const updatedMemo = new Memoir([lat, lng], savedDate, savedText);
        updatedMemo.id = selectedItem.id;
        const indexItem = this.#list.findIndex(
          (item) => item.id === updatedMemo.id
        );
        const newmemos = (this.#list[indexItem] = updatedMemo);
        console.log(newmemos);
        console.log(this.#list);

        this._hideForm();
        this._setLocalStorage();
        location.reload();
      });
    }
  }

  _moveToPopup(e) {
    const journalEl = e.target.closest(".journal__list");
    if (!journalEl) return;
    const clickedJournal = this.#list.find(
      (item) => item.id === journalEl.dataset.id
    );
    this.#map.setView(clickedJournal.coords, 14, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("journals", JSON.stringify(this.#list));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("journals"));
    if (data !== null) {
      this.#list = data;
      this.#list.forEach((item) => this._renderMemoList(item));
    }
  }
  _sortByDate(e) {
    if (e.target.classList.contains("btn__sort__des")) {
      const latest = this.#list.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      this.#list = latest;
      this._setLocalStorage();
      location.reload();
    }
    if (e.target.classList.contains("btn__sort__asc")) {
      const latest = this.#list.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      this.#list = latest;
      this._setLocalStorage();
      location.reload();
    }
  }
  _clearAll(e) {
    e.preventDefault();
    if (e.target.classList.contains("btn__deleteAll")) {
      this.reset();
    }
  }
  reset() {
    localStorage.removeItem("journals");
    location.reload();
  }
}

const app = new App();
