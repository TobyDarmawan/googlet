const movieBlocks = document.getElementsByClassName("grid-item-padding");
let num = 0;
const ratingMap = {
  "Internet Movie Database": "IMDB",
  "Rotten Tomatoes": "RT",
  "Metacritic": "Metacritic",
}

document.addEventListener("keydown", (event)=>{
  if(event.key == "d" && event.ctrlKey){
    if(document.querySelector('.googlet-window')){
      document.querySelector('.googlet-window').remove()
    }
    else{
      const word = document.getSelection()
      let parent = word.anchorNode
      while (parent != null && parent.localName != "p") {
        console.log(parent.localName)
        parent = parent.parentNode;
      }
      const fullText = parent == null ? word : (parent.textContent)
      console.log(`fullText ${typeof(fullText)}`)
      const sentences = fullText.toString().split('. ')
      let context = ""
      sentences.forEach(sentence => {
        if (sentence.indexOf(word)>=0){
          context = sentence;
        }
      })
      const prefix = "Context: Apple Inc. is an American multinational technology company headquartered in Cupertino, California, United States.\nQ: With regards to Apple, is it expensive?\nA: Apple products are often expensive due to their build quality.\n\nContext: Death Stranding is a 2019 action game developed by Kojima Productions.\nQ: With regards to Death Stranding, give me the director name.\nA: Hideo Kojima.\n"
      const query = prefix+`Context: ${context}\nQ: With regards to ${word}, `
      console.log(context)
      const wordBounds = word.getRangeAt(0).getBoundingClientRect()
      generalSearchWindow(query, wordBounds.left, wordBounds.bottom)
    }
  }
})

for (var i = 0; i < movieBlocks.length; i++) {
  const movie = movieBlocks[i]
  const child = movie.getElementsByTagName("strong")[0]
  const movieTitle = child.getAttribute("title")
  const bounds = movie.getBoundingClientRect()
  child.addEventListener('mouseover', (event)=> {
    const prevWindows = document.querySelectorAll('.googlet-window')
    prevWindows.forEach(w => w.remove())
    queryMovie(movieTitle, bounds.left+12, event.clientY+30)
  })

  child.addEventListener('mouseout', (event)=> {
    const prevWindow = document.querySelector('.googlet-window')
    console.log()
    const ansDiv = document.querySelector("#director-div")
    console.log(ansDiv)
    if(!prevWindow.querySelector("#search-field").value.trim().length && !ansDiv){
      prevWindow.remove()
    }
  })
}

function queryMovie(title, xPos, yPos) {
    const OMDB_KEY = `<omdb_api_key`
    const fetchPromise = fetch(
      `https://www.omdbapi.com/?s=${title}&apikey=${OMDB_KEY}`
    );
    fetchPromise
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => fetch(`https://www.omdbapi.com/?i=${data["Search"][0]["imdbID"]}&apikey=${OMDB_KEY}`))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      return response.json();
    })
    .then((data)=>movieSearchWindow(data, xPos, yPos))
    .catch((error) => {
      throw new Error(`Unable to get definition. ${error}`);
    })
}

function createSearchWindow(xPos, yPos){
  const googletWindow= document.createElement("div");
  googletWindow.className="googlet-window"
  googletWindow.id="search-window"

  googletWindow.style.top = `${yPos}px`
  googletWindow.style.left = `${xPos}px`
  const searchForm = document.createElement("FORM")
  searchForm.id = "search-form"
  const searchField = document.createElement("INPUT")
  searchField.id="search-field"
  const searchButton = document.createElement("INPUT")
  const exitButton = document.createElement("BUTTON")
  exitButton.id = "exit-button"
  exitButton.innerHTML="Button"
  console.log(exitButton)
  exitButton.onclick = function(){
    document.querySelector('.googlet-window').remove()
  }
  searchField.setAttribute("type", "text")
  searchButton.setAttribute("type", "submit")
  searchButton.setAttribute("value", "Go!")

  searchForm.appendChild(searchField)
  googletWindow.appendChild(searchForm)
  document.body.prepend(googletWindow);
  searchField.focus();
}

function generalSearchWindow(prefixQuery, xPos, yPos){
  createSearchWindow(xPos, yPos)
  const googletWindow = document.querySelector(".googlet-window")
  const searchForm = document.querySelector("#search-form")
  const searchField = document.querySelector("#search-field")

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if(document.querySelector(".response-div")){
      document.querySelector(".response-div").remove()
    }
    const subquery = searchField.value
    if(!subquery.trim().length){
      return;
    }
    let query = prefixQuery
    if (subquery.slice(-1) == "."){
      query += 'give me the '
    }
    query += subquery + '\nA:'
    const answer = document.createElement("p")
    answer.id="ans-div"
    getAnswer(query).then(data => {
      answer.textContent = data
      const responseDiv = document.createElement("div")
      responseDiv.className = "response-div"
      responseDiv.appendChild(answer)
      googletWindow.appendChild(responseDiv)
    })
  })
}

function movieSearchWindow(data, xPos, yPos){
  createSearchWindow(xPos, yPos)
  const googletWindow = document.querySelector(".googlet-window")
  const searchForm = document.querySelector("#search-form")
  const searchField = document.querySelector("#search-field")
  
  const director = document.createElement("p")
  director.textContent = `Director: ${data["Director"]}`
  const cast = document.createElement("p")
  cast.textContent = `Cast: ${data["Actors"]}`

  const responseDiv = document.createElement("div")
  responseDiv.className = "response-div"
  googletWindow.appendChild(responseDiv)
  responseDiv.append(director, cast, getRatingsDiv(data["Ratings"]))

  searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if(document.querySelector(".response-div")){
      document.querySelector(".response-div").remove()
    }
    const subquery = searchField.value
    if (subquery.trim().length > 0){
      const answer = document.createElement("p")
      answer.id="ans-div"
      let query = `Regarding the movie ${data["Title"]}(${data["Year"]}), `
      if (subquery.slice(-1) == "."){
        query += 'give me the '
      }
      getAnswer(query+subquery).then(data => {
        const responseDiv = document.createElement("div")
        responseDiv.className = "response-div"
        googletWindow.appendChild(responseDiv)
        answer.textContent = data
        responseDiv.appendChild(answer)
      })
    }
  })
}
function getRatingsDiv(ratings){
  const ratingsDiv= document.createElement("div");
  ratingsDiv.className = "ratings-div"
  ratings.forEach((rating, i) => {
    const ratingDiv = document.createElement("div");
    ratingDiv.className="rating"

    const ratingSource = document.createElement("p")
    ratingSource.className = "rating-source"
    const ratingValue = document.createElement("p")
    ratingSource.textContent = ratingMap[rating["Source"]]
    ratingValue.textContent = rating["Value"]
    ratingValue.className = "rating-value"

    ratingDiv.append(ratingSource,ratingValue)
    ratingsDiv.append(ratingDiv)
  })
  return ratingsDiv
}
function getAnswer(query){
  const url = `https://api.openai.com/v1/completions`
  const OPENAI_KEY = '<OpenAI_api_key>'
  const model = {
    "model": "text-davinci-003",
    "prompt": query,
    "max_tokens": 200,
    "temperature": 0,
  }
  return fetch(url, {
      method: 'POST',
      headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify(model)
    }
  ).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  })
  .then(data => data["choices"][0]["text"])
  .catch(error => {
    throw new Error(`Unable to query OpenAI: ${error}`);
  })
}




