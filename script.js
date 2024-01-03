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
  #marker = [];

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

  // get current position
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

  // using position and load the map
  _loadMap(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, 13);
    L.tileLayer("https://tile.openstreetmap.de/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      ext: "png",
    }).addTo(this.#map);
    this.#map.on("click", this._showForm.bind(this));
    this.#list.forEach((work) => this._renderMarker(work));
  }

  // show form
  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    menu.classList.remove("hidden");
  }

  // hide form
  _hideForm() {
    date.value = text.value = "";
    form.classList.add("hidden");
  }

  // clear input with btn
  _clearInput(e) {
    if (e.target.classList.contains("btn__clear")) {
      // Clear the form inputs
      date.value = "";
      text.value = "";
    }
  }

  //create new memo
  _newMemo(e) {
    e.preventDefault();

    const { lat, lng } = this.#mapEvent.latlng;
    // get value from the from
    const savedDate = date.value;
    const savedText = text.value;

    // create new object using the data from the form
    const memo = new Memoir([lat, lng], savedDate, savedText);

    this.#list.push(memo);
    this._renderMarker(memo);
    this._renderMemoList(memo);
    this._hideForm();
    this._setLocalStorage();
  }

  // render marker
  _renderMarker(memo) {
    const newMarker = L.marker(memo.coords, { markerID: memo.id })
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
      .setPopupContent(`Your Memoir ${memo.date}✨`)
      .openPopup();

    this.#marker.push(newMarker);
  }

  //render memo
  _renderMemoList(memo) {
    let html = `
    <li class="journal__list" id="${memo.id}" data-id="${memo.id}">
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

  // show edit/delete button
  _showToggleMenu(e) {
    const toggle = e.target.closest(".toggle__menu");
    if (toggle) {
      const editMenu = toggle.querySelector(".edit__menu");
      const editBtn = toggle.querySelector(".btn__toggle");
      editMenu.classList.toggle("hidden");
      editBtn.classList.toggle("hidden");
    }
  }

  //hide edit/delete button
  _hiddenToggleMenu(e) {
    const toggle = e.target.closest(".toggle__menu");
    if (toggle === null && this.#editMenuBtn !== null) {
      this.#editMenuBtn.classList.add("hidden");
      this.#toggleBtn.classList.remove("hidden");
    }
  }

  //delete memo
  _deleteMemoList(e) {
    // click the delete
    const deleteEl = e.target.closest(".journal__list");
    if (e.target.classList.contains("btn__delete")) {
      const updatedList = this.#list.filter(
        (item) => item.id !== deleteEl.dataset.id
      );
      const updatedMarker = this.#marker.find(
        (item) => item.options.markerID === deleteEl.dataset.id
      );

      deleteEl.remove();

      // delete marker
      this.#map.removeLayer(updatedMarker);
      this.#list = updatedList;

      this._setLocalStorage();
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

      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const [lat, lng] = selectedItem.coords;

        const savedDate = date.value;
        const savedText = text.value;

        const updatedMemo = new Memoir([lat, lng], savedDate, savedText);
        updatedMemo.id = selectedItem.id;
        // find updated item in the list and change it
        const indexItem = this.#list.findIndex(
          (item) => item.id === updatedMemo.id
        );

        this.#list[indexItem] = updatedMemo;
        this._hideForm();
        this._updateMemoOnPage(updatedMemo);
        this._setAndReload();

        //TODO: instead of reload the whole page, what can be done?
      });
    }
  }

  _updateMemoOnPage(updatedMemo) {
    const memoElement = document.getElementById(updatedMemo.id);
    // Update the DOM element with the new memo data
    if (memoElement) {
      memoElement.querySelector(".journal__list--date").textContent =
        updatedMemo.date;

      memoElement.querySelector(".journal__list--details").textContent =
        updatedMemo.text;
    } else {
      console.log("Memo Element not found in DOM.");
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
      const oldest = this.#list.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      this.#list = oldest;
      this._setLocalStorage();
      location.reload();
    }
  }
  _clearAll(e) {
    e.preventDefault();
    if (e.target.classList.contains("btn__deleteAll")) {
      localStorage.removeItem("journals");
      // Clear the UI by removing list items
      const journalListItems = containerForm.querySelectorAll(".journal__list");
      journalListItems.forEach((item) => item.remove());
      // Clear all markers
      this.#marker.forEach((item) => this.#map.removeLayer(item));
      // Reset the list
      this.#list = [];
    }
  }

  _moveToPopup(e) {
    const journalEl = e.target.closest(".journal__list");
    if (!journalEl) return;
    const clickedJournal = this.#list.find(
      (item) => item.id === journalEl.dataset.id
    );
    this.#map.setView(clickedJournal.coords, 13, {
      animate: true,
      pan: {
        duration: 0.8,
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

  _setAndReload() {
    this._setLocalStorage();
    location.reload();
  }
}

const app = new App();
