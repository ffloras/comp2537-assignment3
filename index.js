const levels = [
  {
    difficulty: "easy",
    cards: 6,
    width: "600px",
    height: "400px",
    time: { mins: 0, secs: 40 },
  },
  {
    difficulty: "medium",
    cards: 12,
    width: "800px",
    height: "600px",
    time: { mins: 0, secs: 50 },
  },
  {
    difficulty: "hard",
    cards: 24,
    width: "1200px",
    height: "800px",
    time: { mins: 1, secs: 30 },
  },
];
const maxPokemon = 1302;
const limit = 100;
let gameActive = true;

async function setup() {
  setDisplay()
  setStyleButton();
  setResetButton();

  const pokemonSet = await getPokemonSet();

  let level = await setLevelAndStart();

  let pokemons = await choosePokemons(pokemonSet, level);
  setupCards(pokemons, level);
  let status = setupStatus(level);
  gameActive = true;
  let winStatus = await Promise.race([
    gameLogic(status),
    countdown(levels[level].time.mins, levels[level].time.secs),
  ]);
  gameEnd(winStatus);
}

$(document).ready(setup);


function setupStatus(level) {
  let gameStatusTemplate = document.getElementById("game-status-template");
  let newCard = gameStatusTemplate.content.cloneNode(true);
  let clicks = 0;
  let totalPairs = levels[level].cards / 2;
  let pairsLeft = levels[level].cards / 2;
  let pairsMatched = 0;
  let mins = levels[level].time.mins;
  let secs = levels[level].time.secs;

  let status = {
    clicks: clicks,
    totalPairs: totalPairs,
    pairsLeft: pairsLeft,
    pairsMatched: pairsMatched,
  };

  newCard.getElementById("clicks").innerHTML = clicks;
  newCard.getElementById("total-pairs").innerHTML = totalPairs;
  newCard.getElementById("pairs-matched").innerHTML = pairsMatched;
  newCard.getElementById("pairs-left").innerHTML = pairsLeft;
  newCard.getElementById("minutes").innerHTML = mins;
  newCard.getElementById("seconds").innerHTML = secs;
  newCard.getElementById("total-time").innerHTML = mins == 0 ? `${secs}s` : `${mins}m ${secs}s`;
  document.getElementById("game-status").appendChild(newCard);

  return status;
}

function countdown(mins, secs) {
  return new Promise((resolve, reject) => {
    try {
      const timer = setInterval(function(){
        if (!gameActive) {
          clearInterval(timer);
          resolve(null);
          return;
        } else if (mins <= 0 && secs <= 0) {
          clearInterval(timer);
          resolve(false);
          return;
        } else if (secs <= 0) {
          secs = 59;
          mins--;
        } else {
          secs--;
        }
        document.getElementById("minutes").innerHTML = mins;
        document.getElementById("seconds").innerHTML = String(secs).padStart(2,"0");
      }, 1000);
    } catch (error) {
      reject(error);
    }
  });
}

function setLevelAndStart() {
  return new Promise((resolve, reject) => {
    //set default level to easy
    $("#easy").css("background-color", "#E27F34");
    $("#medium , #hard").css("background-color", "#E9C41D");
    let level = 0;

    //set difficulty buttons
    $(".difficulty-button").on("click", function () {
      $("#easy , #medium , #hard").css("background-color", "#E9C41D");
      $(this).css("background-color", "#E27F34");
      level = levels.findIndex((lvl) => lvl.difficulty === this.id);
    });

    $("#start").css("display", "inline");
    $("#reset").css("display", "none");

    //set start button
    $("#start").on("click", function () {
      $("#start").css("display", "none");
      $("#reset").css("display", "inline");
      $("#title").css("display", "none");
      
      resolve(level);
      return;
    });
  });
}

function setResetButton() {
  $("#reset").on("click", (e) => {
    gameActive = false;
    document.getElementById("game_grid").innerHTML = "";
    document.getElementById("game-status").innerHTML = "";
    $("#game_grid").css("width", levels[0].width);
    $("#game_grid").css("height", levels[0].height);
    $(".difficulty-button").off("click");
    $("#start").off("click");
    $("#reset").off("click");
    $(".card").off("click");
    $("#style").off("click");

    $("#game_grid").css("background-color", "");
    $(".card, .front_face, .back_face").css("background-color", "");
    $("#style").removeClass("btn-light");
    $("#style").addClass("btn-dark");
    $("#style").html("Switch to Dark Mode");
  setup();
  });
}

function FlipAll() {
  setTimeout(() => {
    alert("Power up time");
    $(".unmatched").toggleClass("flip");
    $(".unmatched").addClass("disabled");
    setFlipAllTimer()
      .then(() => {
        setTimeout(() => {
          $(".unmatched").removeClass("disabled");
        }, 1000);
      })
      .catch((err) => {
        console.error(err);
      });
  }, 500);
}

function setFlipAllTimer() {
  try {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        $(".unmatched").toggleClass("flip");
        resolve(undefined);
      }, 1000);
    });
  } catch (error) {
    console.error(error);
  }
}

function setStyleButton() {
  $("#style").on("click", function () {
    if ($(this).hasClass("btn-dark")) {
      $("#game_grid").css("background-color", "black");
      $(".card, .front_face, .back_face").css("background-color", "black");
      $(this).removeClass("btn-dark");
      $(this).addClass("btn-light");
      $(this).html("Switch to Light Mode");

    } else if($(this).hasClass("btn-light")) {
      $("#game_grid").css("background-color", "");
      $(".card, .front_face, .back_face").css("background-color", "");
      $(this).removeClass("btn-light");
      $(this).addClass("btn-dark");
      $(this).html("Switch to Dark Mode");

    }
  });
}

function setDisplay() {
  $("#game_grid").css("display", "none");
  $("#title").css("display", "block");
  $("#style").css("display", "none");
}

async function choosePokemons(allPokemons, level) {
  let totalPokemon = allPokemons.length;

  let pokemonNameArray = [];
  let numPokemons = levels[level].cards / 2;
  let pokemonArray = [];
  let promises = [];

  while (pokemonNameArray.length < numPokemons + 2) {
    let randNum = Math.floor(Math.random() * totalPokemon);
    let randPokemon = allPokemons[randNum].name;
    if (!pokemonNameArray.includes(randPokemon)) {
      pokemonNameArray.push(randPokemon);
    }
  }

  pokemonNameArray.forEach(async (pokemonName) => {
    promises.push(
      fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`).then(
        (response) => response.json()
      )
    );
  });

  let responses = await Promise.all(promises);
  for (let i = 0; i < levels[level].cards / 2; i++) {
    if (responses[i]) {
      let sprite = responses[i].sprites.other["official-artwork"].front_default;
      pokemonArray.push({ sprite: sprite, name: responses[i].name });
    }
  }
  console.log(levels[level].cards)
  console.log(pokemonNameArray)
  console.log(pokemonArray)

  pokemonArray = pokemonArray.concat(pokemonArray);
  randomizedArray = [];

  while (pokemonArray.length > 0) {
    let randNum = Math.floor(Math.random() * pokemonArray.length);
    let pokemon = pokemonArray.splice(randNum, 1)[0];
    randomizedArray.push(pokemon);
  }
  return randomizedArray;
}

function delay() {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

function setupCards(pokemons, level) {
  let numCards = levels[level].cards;
  let cardTemplate = document.getElementById("card-template");

  let grid = document.getElementById("game_grid");
  grid.style.width = levels[level].width;
  grid.style.height = levels[level].height;

  for (let i = 0; i < levels[level].cards; i++) {
    let newCard = cardTemplate.content.cloneNode(true);
    let pokemonImg = newCard.querySelector(".front_face");
    //console.log(pokemons)

    pokemonImg.src = pokemons[i].sprite;
    pokemonImg.id = "img" + (i + 1);
    pokemonImg.alt = pokemons[i].name;
    newCard.querySelector(".card").style.width = `${
      ((level + 2) / numCards) * 100
    }%`;
    console.log((level + 2) / numCards);

    grid.appendChild(newCard);
  }
  $("#game_grid").css("display", "flex");
  $("#style").css("display", "block");
}

function gameEnd(winStatus) {
  if (winStatus == true) {
    alert("You WIN!");
  } else if (winStatus == false) {
    $(".card").off("click");
    alert("Game Over");
  }
}

async function gameLogic(status) {
  return new Promise((resolve, reject) => {
    let firstCard = undefined;
    let secondCard = undefined;
    let prevPairs = null;
    $(".card").on("click", async function () {
      //if card has been clicked and hasn't been flipped back, do nothing
      if ($(this).hasClass("disabled")) {
        return;
      }
      if (firstCard && secondCard) {
        return;
      }

      //after clicking, disable and flip card
      $(this).addClass("disabled");
      $(this).toggleClass("flip");

      status.clicks = updateClicks(status.clicks);

      if (!firstCard) {
        firstCard = $(this).find(".front_face")[0];
      } else {
        secondCard = $(this).find(".front_face")[0];

        if (firstCard.src == secondCard.src) {
          $(`#${firstCard.id}`).parent().off("click");
          $(`#${secondCard.id}`).parent().off("click");
          $(`#${firstCard.id}`).parent().removeClass("unmatched");
          $(`#${secondCard.id}`).parent().removeClass("unmatched");

          [status.pairsLeft, status.pairsMatched] = updatePairs(status.pairsLeft, status.pairsMatched);

        } else { //cards don't match
          await setFlipTimer(firstCard, secondCard);
          await setClickTimer(firstCard, secondCard);
        }
        firstCard = undefined;
        secondCard = undefined;

        if (status.pairsLeft == 0) {
          await setWinTimer();
          resolve(true);
          return;
        } else if (status.pairsMatched && status.pairsMatched % 6 == 0 & prevPairs != status.pairsMatched) {
          FlipAll();
          prevPairs = status.pairsMatched;
        }
      }
    });
  });
}

function updatePairs(pairsLeft, pairsMatched) {
  pairsLeft--;
  pairsMatched++;
  document.getElementById("pairs-matched").innerHTML = pairsMatched;
  document.getElementById("pairs-left").innerHTML = pairsLeft;
  return [pairsLeft, pairsMatched];
}

function updateClicks(clicks) {
  clicks++;
  document.getElementById("clicks").innerHTML = clicks;
  return clicks;
}

const setFlipTimer = (firstCard, secondCard) => {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        $(`#${firstCard.id}`).parent().toggleClass("flip");
        $(`#${secondCard.id}`).parent().toggleClass("flip");
        resolve();
      }, 1000);
    } catch (err) {
      reject(err);
    }
  });
};

const setClickTimer = (firstCard, secondCard) => {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        $(`#${firstCard.id}`).parent().removeClass("disabled");
        $(`#${secondCard.id}`).parent().removeClass("disabled");
        resolve();
      }, 500);
    } catch (err) {
      reject(err);
    }
  });
};

const setWinTimer = () => {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        gameActive = false;
        resolve();
      }, 1000);
    } catch (err) {
      reject(err);
    }
  });
};

async function getPokemonSet() {
  return new Promise((resolve, reject) => {
    let offset = Math.floor(Math.random() * (maxPokemon - limit));
    console.log(offset);
    fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`)
      .then((response) => {
        return response.json();
      })
      .then((response) => {
        resolve(response.results);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

// async function setup() {
//   let firstCard = undefined
//   let secondCard = undefined
//   $(".card").on(("click"), async function () {
//     if ($(this).hasClass("disabled")) {
//       return;
//     }

//     $(this).addClass("disabled");
//     $(this).toggleClass("flip");

//     if (!firstCard) {
//       //$(this).toggleClass("flip");
//       firstCard = $(this).find(".front_face")[0]
//     }
//     else {
//       let nextCard = $(this).find(".front_face")[0];

//       if (nextCard != firstCard) {
//         $(this).toggleClass("flip");
//         secondCard = nextCard;

//         console.log(firstCard, secondCard);

//         $(`#${firstCard.id}`).parent().off("click");
//         $(`#${secondCard.id}`).parent().off("click");

//         if (firstCard.src == secondCard.src) {
//           console.log("match")
//         } else {
//           console.log("no match")
//           await setTimer(firstCard, secondCard);
//           console.log(firstCard.id + " " + secondCard.id)
//           $(`#${firstCard.id}`).parent().on("click");
//           $(`#${secondCard.id}`).parent().on("click");
//         }
//         firstCard = undefined;
//         secondCard = undefined;

//       }

//     }
//   });
// }
