const db = new Dexie("LeveltarDB");

db.version(1).stores({
  archive: "++id, type",
});

const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("search-input");
const container = document.getElementById("tartalom-container");
const resetBtn = document.getElementById("resetBtn");
const prevPage = document.getElementById("prevpage");
const nextPage = document.getElementById("nextpage");
const paGes = document.getElementById("pages");
let actualPage = document.getElementById("actualpage");
let allPages = document.getElementById("allpages");

let szurtAdatok = [];
let currentType = [];
let currentPage = 1;
const rowsPerPage = 50;

prevPage.disabled = true;
nextPage.disabled = true;

async function loadArchive(type) {
  currentType = type;
  container.innerHTML = "Adatbázis betöltés...";
  let chooseData = [];
  try {
    const count = await db.archive.where("type").equals(type).count();

    if (count === 0) {
      container.innerHTML = "Adatbázis betöltés...";

      const response = await fetch(`json_datastore/${type}.json`);
      if (!response.ok) throw new Error("A fájl nem található.");
  
  const chooseData = await response.json();

      const savedData = chooseData.map((item) => ({
        ...item,
        type: type,
      }));

      await db.archive.bulkPut(savedData);
    }

    if (type.length === 0) {
      container.innerHTML = "Válassz egy adatbázist.";
      return;
    }

    await refreshDisplay("");
  } catch (error) {
    container.innerHTML = `<p>Hiba történt: ${error.message}</p>`;
  }
  searchInput.value = "";
  resetBtn.disabled = false;
  paGes.style.visibility = "visible";
}

async function refreshDisplay(keresoSzo) {
  currentPage = 1;

  let query = await db.archive.where("type").equals(currentType).toArray();

  if (keresoSzo) {
    szurtAdatok = query.filter((row) => {
      return Object.entries(row).some(
        ([key, val]) =>
          key != "type" &&
          key != "id" &&
          String(val).toLowerCase().includes(keresoSzo),
      );
    });
  } else {
    szurtAdatok = query;
  }
  displayData(szurtAdatok.slice(0, 50));
  updateButtons();
}

function displayData(osszesAdat) {
  if (osszesAdat.length === 0) {
    container.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status"></div>
                <p>Adatok betöltése folyamatban...</p>
            </div>
        `;
    return;
  }

  let tableHtml =
    '<table class="w-100 text-center archivetable table-animated"><thead><tr>';
  const headers = Object.keys(osszesAdat[0]).filter(
    (h) => h !== "id" && h !== "type",
  ); 
  headers.forEach((header) => {
    // az összes nevet egy cellába rakjuk
    tableHtml += `<th class="border">${header}</th>`;
  });
  tableHtml += "</tr></thead><tbody>";

  osszesAdat.forEach((row) => {
    tableHtml += "<tr>";
    headers.forEach((header) => {
      const cellValue = row[header] !== undefined ? row[header] : "-";
      tableHtml += `<td class="border p-3">${cellValue}</td>`;
    });
    tableHtml += "</tr>";
  });

  tableHtml += "</tbody></table>";
  container.innerHTML = tableHtml;
}

searchBtn.addEventListener("click", () => {
  const keresoSzo = String(searchInput.value).toLowerCase().trim();
  refreshDisplay(keresoSzo);
});

searchInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    searchBtn.click();
    searchInput.value = "";
  }
});

resetBtn.addEventListener("click", () => {
  const floorSelect = document.getElementById("floor");
  floorSelect.value = "";

  const storeBtns = document.querySelectorAll(".storebtn");

  storeBtns.forEach((div) => {
    div.classList.remove("visible");
  });

  searchInput.value = "";
  container.innerHTML = "Válassz egy adatbázist!";
  szurtAdatok = [];
  currentType = "";
  currentPage = 1;
  updateButtons();

  resetBtn.disabled = true;
});

prevPage.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    displayData(szurtAdatok.slice(start, end));

    updateButtons();
  }
});

nextPage.addEventListener("click", () => {
  if (currentPage * rowsPerPage < szurtAdatok.length) {
    currentPage++;
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    displayData(szurtAdatok.slice(start, end));

    updateButtons();
  }
});

function updateButtons() {
  prevPage.disabled = currentPage === 1;
  const hasNextPage = currentPage * rowsPerPage < szurtAdatok.length;
  nextPage.disabled = !hasNextPage;

  const allPageNumber = Math.ceil(szurtAdatok.length / rowsPerPage);

  allPages.innerText = szurtAdatok.length > 0 ? allPageNumber : 0;
  actualPage.innerText = szurtAdatok.length > 0 ? currentPage : 0;
}

document.getElementById("floor").addEventListener("change", function () {
  
  const storeBtns = document.querySelectorAll(".storebtn");

  storeBtns.forEach((div) => {
    div.classList.remove("visible");
  });

  const chooseId = this.value;

  if (chooseId) {
    const displayContent = document.getElementById(chooseId);
    if (displayContent) {
      displayContent.classList.add("visible");
    }
  }
  updateButtons();
});

document.addEventListener("DOMContentLoaded", () => {
  const questions = document.querySelectorAll(".question");

  questions.forEach(question => {
    question.addEventListener("click", function () {
        const nextAnswer = this.nextElementSibling;
        const icon = this.querySelector(".bi");

        if(nextAnswer.classList.contains("open")) {
            nextAnswer.classList.remove("open");
            this.classList.remove("active");
            this.querySelector("span").textContent = "+";
            icon.classList.replace("bi-arrow-down", "bi-arrow-right");
        }

        else {
            document.querySelectorAll(".answer").forEach(answer => {
                answer.classList.remove("open");
            });

            document.querySelectorAll(".question").forEach(q => {
                q.classList.remove("active");
                q.querySelector("span").textContent = "+";

                const otherIcon = q.querySelector(".bi");
                if (otherIcon) {
                    otherIcon.classList.replace("bi-arrow-down", "bi-arrow-right");
                }
            });

            icon.classList.replace("bi-arrow-right", "bi-arrow-down");
            nextAnswer.classList.add("open");
            this.classList.add("active");
            this.querySelector("span").textContent = "-";
        }
    });
    });
  });

let app = angular.module("archivesearch", []);
app.controller("storeLists", function ($scope) {
  $scope.currentTheme = "light-mode";

  $scope.themechange = function () {
    if ($scope.currentTheme === "light-mode") {
      $scope.currentTheme = "dark-mode";
    } else {
      $scope.currentTheme = "light-mode";
    }
  };
});
