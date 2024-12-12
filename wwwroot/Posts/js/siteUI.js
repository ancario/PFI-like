////// Author: Nicolas Chourot
////// 2024
//////////////////////////////

const periodicRefreshPeriod = 10;
const waitingGifTrigger = 2000;
const minKeywordLenth = 3;
const keywordsOnchangeDelay = 500;

let currentPostsCount = -1;
let categories = [];
let selectedCategory = "";
let currentETag = "";
let periodic_Refresh_paused = false;
let postsPanel;
let itemLayout;
let waiting = null;
let showKeywords = false;
let keywordsOnchangeTimger = null;

Init_UI();
async function Init_UI() {
  postsPanel = new PageManager(
    "postsScrollPanel",
    "postsPanel",
    "postSample",
    renderPosts
  );
  const user = JSON.parse(sessionStorage.getItem("user")); // Récupérer les données utilisateur
  const hasFullAccess =
    user?.Authorizations?.readAccess === 2 &&
    user?.Authorizations?.writeAccess === 2;

  $("#createPost").on("click", async function () {
    showCreatePostForm();
  });

  $("#abort").on("click", async function () {
    showPosts();
  });
  $("#aboutCmd").on("click", function () {
    showAbout();
  });
  $("#showSearch").on("click", function () {
    toogleShowKeywords();
    showPosts();
  });

  installKeywordsOnkeyupEvent();
  await showPosts();
  start_Periodic_Refresh();
}

/////////////////////////// Search keywords UI //////////////////////////////////////////////////////////

function installKeywordsOnkeyupEvent() {
  $("#searchKeys").on("keyup", function () {
    clearTimeout(keywordsOnchangeTimger);
    keywordsOnchangeTimger = setTimeout(() => {
      cleanSearchKeywords();
      showPosts(true);
    }, keywordsOnchangeDelay);
  });
  $("#searchKeys").on("search", function () {
    showPosts(true);
  });
}
function cleanSearchKeywords() {
  /* Keep only keywords of 3 characters or more */
  let keywords = $("#searchKeys").val().trim().split(" ");
  let cleanedKeywords = "";
  keywords.forEach((keyword) => {
    if (keyword.length >= minKeywordLenth) cleanedKeywords += keyword + " ";
  });
  $("#searchKeys").val(cleanedKeywords.trim());
}
function gestionAddIcon() {
  const user = JSON.parse(sessionStorage.getItem("user")); // Récupérer les données utilisateur
  const hasFullAccess =
    user?.Authorizations?.readAccess >= 2 &&
    user?.Authorizations?.writeAccess >= 2;
  if (!hasFullAccess) {
    $("#createPost").hide();
  }
}
function showSearchIcon() {
  $("#hiddenIcon").hide();
  $("#showSearch").show();
  if (showKeywords) {
    $("#searchKeys").show();
  } else $("#searchKeys").hide();
}
function hideSearchIcon() {
  $("#hiddenIcon").show();
  $("#showSearch").hide();
  $("#searchKeys").hide();
}
/////////////////////////////////////////////////////////////////////
function toogleShowKeywords() {
  showKeywords = !showKeywords;
  if (showKeywords) {
    $("#searchKeys").show();
    $("#searchKeys").focus();
  } else {
    $("#searchKeys").hide();
    showPosts(true);
  }
}

/////////////////////////// Views management ////////////////////////////////////////////////////////////

function intialView() {
  $("#createPost").show();
  $("#hiddenIcon").hide();
  $("#hiddenIcon2").hide();
  $("#menu").show();
  $("#commit").hide();
  $("#abort").hide();
  $("#form").hide();
  $("#form").empty();
  $("#aboutContainer").hide();
  $("#errorContainer").hide();
  showSearchIcon();
  gestionAddIcon();
}
/////////////////////////////////////////////////////////////////////
async function showPosts(reset = false) {
  intialView();
  $("#viewTitle").text("Fil de nouvelles");
  periodic_Refresh_paused = false;
  await postsPanel.show(reset);
}
/////////////////////////////////////////////////////////////////////
function hidePosts() {
  postsPanel.hide();
  hideSearchIcon();
  $("#createPost").hide();
  $("#menu").hide();
  periodic_Refresh_paused = true;
}
/////////////////////////////////////////////////////////////////////
function showForm() {
  hidePosts();
  $("#form").show();
  $("#commit").show();
  $("#abort").show();
}
/////////////////////////////////////////////////////////////////////
function showError(message, details = "") {
  hidePosts();
  $("#form").hide();
  $("#form").empty();
  $("#hiddenIcon").show();
  $("#hiddenIcon2").show();
  $("#commit").hide();
  $("#abort").show();
  $("#viewTitle").text("Erreur du serveur...");
  $("#errorContainer").show();
  $("#errorContainer").empty();
  $("#errorContainer").append($(`<div>${message}</div>`));
  $("#errorContainer").append($(`<div>${details}</div>`));
}
/////////////////////////////////////////////////////////////////////
function showCreatePostForm() {
  showForm();
  $("#viewTitle").text("Ajout de nouvelle");
  renderPostForm();
}
/////////////////////////////////////////////////////////////////////
function showEditPostForm(id) {
  showForm();
  $("#viewTitle").text("Modification");
  renderEditPostForm(id);
}
/////////////////////////////////////////////////////////////////////
function showDeletePostForm(id) {
  showForm();
  $("#viewTitle").text("Retrait");
  renderDeletePostForm(id);
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

function handleLikePost(idPost) {
  const user = JSON.parse(sessionStorage.getItem("user")); 
  const userId = user?.Id
  Likes_API.ILikeThat(idPost,userId);
console.log("allo log like")
}
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////


function showAbout() {
  hidePosts();
  $("#hiddenIcon").show();
  $("#hiddenIcon2").show();
  $("#abort").show();
  $("#viewTitle").text("À propos...");
  $("#aboutContainer").show();
}
/////////////////////////////////////////////////////////////////////
function showDeconnexion() {
  hidePosts();
  $("#hiddenIcon").show();
  $("#hiddenIcon2").show();
  $("#abort").show();
  RenderDeconnexions();
}
/////////////////////////////////////////////////////////////////////
function showConnexion() {
  hidePosts();
  $("#hiddenIcon").show();
  $("#hiddenIcon2").show();
  $("#abort").show();
  $("#viewTitle").text("Connexion");
  RenderConnexions();
}
/////////////////////////////////////////////////////////////////////
function showGestionUsager() {
  hidePosts();
  $("#hiddenIcon").show();
  $("#hiddenIcon2").show();
  $("#abort").show();
  $("#viewTitle").text("GestionUsager");
}
/////////////////////////////////////////////////////////////////////
function showModificationProfil() {
  hidePosts();
  $("#hiddenIcon").show();
  $("#hiddenIcon2").show();
  $("#abort").show();
  $("#viewTitle").text("Modification du profil");
  const user = JSON.parse(sessionStorage.getItem("user"));
  renderInscription(user);
}
/////////////////////////////////////////////////////////////////////
function showInscription() {
  hidePosts();
  $("#hiddenIcon").show();
  $("#hiddenIcon2").show();
  $("#abort").show();
  $("#viewTitle").text("Inscription");
  renderInscription();
}

//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

//////////////////////////// Posts rendering /////////////////////////////////////////////////////////////

function start_Periodic_Refresh() {
  $("#reloadPosts").addClass("white");
  $("#reloadPosts").on("click", async function () {
    $("#reloadPosts").addClass("white");
    postsPanel.resetScrollPosition();
    await showPosts();
  });
  setInterval(async () => {
    if (!periodic_Refresh_paused) {
      let etag = await Posts_API.HEAD();
      // the etag contain the number of model records in the following form
      // xxx-etag
      let postsCount = parseInt(etag.split("-")[0]);
      if (currentETag != etag) {
        if (postsCount != currentPostsCount) {
          currentPostsCount = postsCount;
          $("#reloadPosts").removeClass("white");
        } else await showPosts();
        currentETag = etag;
      }
    }
  }, periodicRefreshPeriod * 1000);
}
/////////////////////////////////////////////////////////////////////
async function renderPosts(queryString) {
  let endOfData = false;
  queryString += "&sort=date,desc";
  compileCategories();
  if (selectedCategory != "") queryString += "&category=" + selectedCategory;
  if (showKeywords) {
    let keys = $("#searchKeys").val().replace(/[ ]/g, ",");
    if (keys !== "")
      queryString += "&keywords=" + $("#searchKeys").val().replace(/[ ]/g, ",");
  }
  addWaitingGif();
  let response = await Posts_API.Get(queryString);
  if (!Posts_API.error) {
    currentETag = response.ETag;
    currentPostsCount = parseInt(currentETag.split("-")[0]);
    let Posts = response.data;
    if (Posts.length > 0) {
      Posts.forEach((Post) => {
        postsPanel.append(renderPost(Post));
      });
    } else endOfData = true;
    linefeeds_to_Html_br(".postText");
    highlightKeywords();
    attach_Posts_UI_Events_Callback();
  } else {
    showError(Posts_API.currentHttpError);
  }
  removeWaitingGif();
  return endOfData;
}
function getLikeIcon(userId, like) {
  // Si l'objet like est vide ou non défini, retourner un cœur par défaut (cœur vide)
  if (!like) {
    return "fa-regular fa-heart"; // Cœur vide par défaut
  }

  // Vérifier si la liste des utilisateurs ayant aimé le post est vide
  if (!like.ListOfUserLike || like.ListOfUserLike.length === 0) {
    // Si la liste est vide, retourner un cœur vide
    return "fa-regular fa-heart"; // Cœur vide
  }

  // Vérifier si l'ID de l'utilisateur est dans la liste des likes
  const isUserLiked = like.ListOfUserLike.includes(userId);

  // Retourner l'icône appropriée : cœur plein ou cœur vide
  return isUserLiked ? "fa-solid fa-heart" : "fa-regular fa-heart"; // Cœur plein si l'utilisateur a aimé, sinon cœur vide
}
/////////////////////////////////////////////////////////////////////
  async function fetchAllUsers() {
  let alluser =  await  Accounts_API.index(); 
//  console.log(alluser); 
  return alluser;
}

/////////////////////////////////////////////////////////////////////
function renderPost(post, loggedUser) {
  
 // let alluser =  fetchAllUsers();
  //console.log(typeof alluser )
  const user = JSON.parse(sessionStorage.getItem("user")); // Récupérer les données utilisateur
  const like = Likes_API.FindLike(post.Id)[0];
  let nombreLike = 0;
  if (like && like.ListOfUserLike) {
    nombreLike = like.ListOfUserLike.length;
  }


  console.log(post.listename);

  // console.log( alluser  );
  // let tableauUser = Object.values(alluser)
  // console.log(tableauUser);
  // const likedUserNames =  tableauUser// Convertir en tableau pour traiter les valeurs
  //   .filter(user => like.ListOfUserLike.includes(user.Id)) // Filtrer les utilisateurs correspondants
  //   .map(user => user.Name); // Extraire les noms

  //   console.log(likedUserNames);

  const hasFullAccess =
    user?.Authorizations?.readAccess >= 2 &&
    user?.Authorizations?.writeAccess >= 2;
    const hasHalfAccess =
    user?.Authorizations?.readAccess >=1 &&
    user?.Authorizations?.writeAccess >=1 ;
  let date = convertToFrenchDate(UTC_To_Local(post.Date));
  let crudIcon = ``;
  let listName = "personne n'aime ce commentaire pour l'instant l'aimez vous?";
  console.log(post.listename)
  if(post.listename){
    listName = post.listename.join("\n");
  }

  const heartIconClass = getLikeIcon(user?.Id, like);
  if (hasHalfAccess ) {
    crudIcon += `
       <span class="" postId="${post.Id}" title="nombre de personne qui aime ce post">${nombreLike}</span>
        <span class="likeCmd cmdIconSmall ${heartIconClass}" postId="${post.Id}" title="${listName}"></span>
    `;
}else {
    crudIcon = ``;
  }
 if(hasFullAccess){
   crudIcon +=
  `
  <span class="editCmd cmdIconSmall fa fa-pencil" postId="${post.Id}" title="Modifier nouvelle"></span>
  <span class="deleteCmd cmdIconSmall fa fa-trash" postId="${post.Id}" title="Effacer nouvelle"></span>
  `;

 }
   console.log(post.userOwners );
   console.log(post.test );
   let addOwner= ``;
  if(post.userOwners){
    let photo = "http://localhost:5000/assetsRepository/" +post.userOwners.Avatar;
    addOwner+=`
            <div class="avatar-container">
                <div class="avatar" style="background-image:url('${photo}');"></div>
                <span>${post.userOwners.Name}</span>
            </div>
    `
  }
  
  return $(`
        <div class="post" id="${post.Id}">
            <div class="postHeader">
                ${post.Category}
                ${crudIcon}
            </div>
            <div class="postTitle"> ${post.Title} </div>
            <img class="postImage" src='${post.Image}'/>
          ${addOwner}
            <div class="postDate"> ${date} </div>
            <div postId="${post.Id}" class="postTextContainer hideExtra">
                <div class="postText" >${post.Text}</div>
            </div>
            <div class="postfooter">
                <span postId="${post.Id}" class="moreText cmdIconXSmall fa fa-angle-double-down" title="Afficher la suite"></span>
                <span postId="${post.Id}" class="lessText cmdIconXSmall fa fa-angle-double-up" title="Réduire..."></span>
            </div>
        </div>
    `);
}
/////////////////////////////////////////////////////////////////////
async function compileCategories() {
  categories = [];
  let response = await Posts_API.GetQuery("?fields=category&sort=category");
  if (!Posts_API.error) {
    let items = response.data;
    if (items != null) {
      items.forEach((item) => {
        if (!categories.includes(item.Category)) categories.push(item.Category);
      });
      if (!categories.includes(selectedCategory)) selectedCategory = "";
      updateDropDownMenu(categories);
    }
  }
}
/////////////////////////////////////////////////////////////////////
function updateDropDownMenu() {
  const user = JSON.parse(sessionStorage.getItem("user")); // Récupérer les données utilisateur
  const token = sessionStorage.getItem("token"); // Vérifier si le token existe
  const userId = user?.Id ; // Utiliser l'email comme identifiant unique
  const userName = user?.Name || "Utilisateur"; // Utiliser le nom ou une valeur par défaut
  const avatarUrl = user?.Avatar

  let DDMenu = $("#DDMenu");
  let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
  const hasFullAccess =
    user?.Authorizations?.readAccess === 2 &&
    user?.Authorizations?.writeAccess === 2;
  DDMenu.empty();

  // Affichage de l'avatar et du nom de l'utilisateur

  if (userId && token) {
    DDMenu.append(
      $(`
            <div class="avatar-container">
                <div class="avatar" style="background-image:url('${avatarUrl}');"></div>
                <span>${userName}</span>
            </div>
        `)
    );
  } else {
    DDMenu.append(
      $(`
            <div class="avatar-container">
                <div class="avatar" style="background-image:url('./images/no-avatar.png');"></div>
                <span>Anonyme</span>
            </div>
        `)
    );
  }

  //(gestion des usager)
  if (hasFullAccess) {
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    DDMenu.append(
      $(`
        <div class="dropdown-item menuItemLayout" id="gestionUsagerCmd">
           <i class="menuIcon fa fa-users-cog mx-2"></i> Gestion des usagers
        </div>
    `)
    );
  }

  DDMenu.append($(`<div class="dropdown-divider"></div>`));

  // Options selon l'état de connexion
  if (!userId || !token) {
    // Utilisateur non connecté
    DDMenu.append(
      $(`
            <div class="dropdown-item menuItemLayout" id="connexionCmd">
                <i class="menuIcon fa fa-sign-in mx-2"></i> Connexion
            </div>
        `)
    );
    DDMenu.append(
      $(`
            <div class="dropdown-item menuItemLayout" id="inscriptionCmd">
                <i class="menuIcon fa fa-user-plus mx-2"></i> Inscription
            </div>
        `)
    );
  } else {
    // Utilisateur connecté
    DDMenu.append(
      $(`
            <div class="dropdown-item menuItemLayout" id="profilCmd">
                <i class="menuIcon fa fa-user-edit mx-2"></i> Modification de profil
            </div>
        `)
    );
    DDMenu.append(
      $(`
            <div class="dropdown-item menuItemLayout" id="deconnexionCmd">
                <i class="menuIcon fa fa-sign-out-alt mx-2"></i> Déconnexion
            </div>
        `)
    );
  }

  DDMenu.append($(`<div class="dropdown-divider"></div>`));

  // Catégories
  DDMenu.append(
    $(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
    `)
  );

  DDMenu.append($(`<div class="dropdown-divider"></div>`));

  categories.forEach((category) => {
    selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
    DDMenu.append(
      $(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `)
    );
  });

  DDMenu.append($(`<div class="dropdown-divider"></div>`));

  DDMenu.append(
    $(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
    `)
  );

  // Gestion des clics
  $("#deconnexionCmd").on("click", function () {
    showDeconnexion();
  });
  $("#gestionUsagerCmd").on("click", function () {
    showGestionUsager();
  });
  $("#profilCmd").on("click", function () {
    showModificationProfil();
  });
  $("#connexionCmd").on("click", function () {
    showConnexion();
  });
  $("#inscriptionCmd").on("click", function () {
    showInscription();
  });
  $("#aboutCmd").on("click", function () {
    showAbout();
  });
  $("#allCatCmd").on("click", async function () {
    selectedCategory = "";
    await showPosts(true);
    updateDropDownMenu();
  });
  $(".category").on("click", async function () {
    selectedCategory = $(this).text().trim();
    await showPosts(true);
    updateDropDownMenu();
  });
}
/////////////////////////////////////////////////////////////////////
function attach_Posts_UI_Events_Callback() {
  linefeeds_to_Html_br(".postText");
  // attach icon command click event callback
  $(".editCmd").off();
  $(".editCmd").on("click", function () {
    showEditPostForm($(this).attr("postId"));
  });
  $(".deleteCmd").off();
  $(".deleteCmd").on("click", function () {
    showDeletePostForm($(this).attr("postId"));
  });
  $(".likeCmd").off();
  $(".likeCmd").on("click", function () {
    const postId = $(this).attr("postId");
    handleLikePost(postId); // Appelle une fonction pour gérer le like
  });
  $(".moreText").off();
  $(".moreText").click(function () {
    $(`.commentsPanel[postId=${$(this).attr("postId")}]`).show();
    $(`.lessText[postId=${$(this).attr("postId")}]`).show();
    $(this).hide();
    $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass(
      "showExtra"
    );
    $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass(
      "hideExtra"
    );
  });
  $(".lessText").off();
  $(".lessText").click(function () {
    $(`.commentsPanel[postId=${$(this).attr("postId")}]`).hide();
    $(`.moreText[postId=${$(this).attr("postId")}]`).show();
    $(this).hide();
    $(`.postTextContainer[postId=${$(this).attr("postId")}]`).addClass(
      "hideExtra"
    );
    $(`.postTextContainer[postId=${$(this).attr("postId")}]`).removeClass(
      "showExtra"
    );
  });
}
/////////////////////////////////////////////////////////////////////
function addWaitingGif() {
  clearTimeout(waiting);
  waiting = setTimeout(() => {
    postsPanel.itemsPanel.append(
      $(
        "<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"
      )
    );
  }, waitingGifTrigger);
}
/////////////////////////////////////////////////////////////////////
function removeWaitingGif() {
  clearTimeout(waiting);
  $("#waitingGif").remove();
}

/////////////////////// Posts content manipulation ///////////////////////////////////////////////////////

function linefeeds_to_Html_br(selector) {
  $.each($(selector), function () {
    let postText = $(this);
    var str = postText.html();
    var regex = /[\r\n]/g;
    postText.html(str.replace(regex, "<br>"));
  });
}
/////////////////////////////////////////////////////////////////////
function highlight(text, elem) {
  text = text.trim();
  if (text.length >= minKeywordLenth) {
    var innerHTML = elem.innerHTML;
    let startIndex = 0;

    while (startIndex < innerHTML.length) {
      var normalizedHtml = innerHTML
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      var index = normalizedHtml.indexOf(text, startIndex);
      let highLightedText = "";
      if (index >= startIndex) {
        highLightedText =
          "<span class='highlight'>" +
          innerHTML.substring(index, index + text.length) +
          "</span>";
        innerHTML =
          innerHTML.substring(0, index) +
          highLightedText +
          innerHTML.substring(index + text.length);
        startIndex = index + highLightedText.length + 1;
      } else startIndex = innerHTML.length + 1;
    }
    elem.innerHTML = innerHTML;
  }
}
/////////////////////////////////////////////////////////////////////
function highlightKeywords() {
  if (showKeywords) {
    let keywords = $("#searchKeys").val().split(" ");
    if (keywords.length > 0) {
      keywords.forEach((key) => {
        let titles = document.getElementsByClassName("postTitle");
        Array.from(titles).forEach((title) => {
          highlight(key, title);
        });
        let texts = document.getElementsByClassName("postText");
        Array.from(texts).forEach((text) => {
          highlight(key, text);
        });
      });
    }
  }
}

//////////////////////// Forms rendering /////////////////////////////////////////////////////////////////

async function renderEditPostForm(id) {
  $("#commit").show();
  addWaitingGif();
  let response = await Posts_API.Get(id);
  if (!Posts_API.error) {
    let Post = response.data;
    if (Post !== null) renderPostForm(Post);
    else showError("Post introuvable!");
  } else {
    showError(Posts_API.currentHttpError);
  }
  removeWaitingGif();
}
async function renderDeletePostForm(id) {
  let response = await Posts_API.Get(id);
  if (!Posts_API.error) {
    let post = response.data;
    if (post !== null) {
      let date = convertToFrenchDate(UTC_To_Local(post.Date));
      $("#form").append(`
                <div class="post" id="${post.Id}">
                <div class="postHeader">  ${post.Category} </div>
                <div class="postTitle ellipsis"> ${post.Title} </div>
                <img class="postImage" src='${post.Image}'/>
                <div class="postDate"> ${date} </div>
                <div class="postTextContainer showExtra">
                    <div class="postText">${post.Text}</div>
                </div>
            `);
      linefeeds_to_Html_br(".postText");
      // attach form buttons click event callback
      $("#commit").on("click", async function () {
        await Posts_API.Delete(post.Id);
        if (!Posts_API.error) {
          await showPosts();
        } else {
          console.log(Posts_API.currentHttpError);
          showError("Une erreur est survenue!");
        }
      });
      $("#cancel").on("click", async function () {
        await showPosts();
      });
    } else {
      showError("Post introuvable!");
    }
  } else showError(Posts_API.currentHttpError);
}
function newPost() {
  let Post = {};
  Post.Id = 0;
  Post.Title = "";
  Post.Text = "";
  Post.Image = "news-logo-upload.png";
  Post.Category = "";
  return Post;
}
function newUser() {
  let user = {};
  user.Id = 0;
  user.Name = "";
  user.Email = "";
  user.Password = "";
  user.Avatar = "news-logo-upload.png";
  user.Created = Math.floor(Date.now() / 1000);
  // user.Authorizations = JSON.stringify({ readAccess: 1, writeAccess: 1 });
  user.Authorizations = {
    readAccess: 1,
    writeAccess: 1,
  };
  user.VerifyCode = "unverified"; // Vérification par défaut
  return user;
}
function renderPostForm(post = null) {
  const user = JSON.parse(sessionStorage.getItem("user"));
  let create = post == null;
  if (create) post = newPost();
  $("#form").show();
  $("#form").empty();
  $("#form").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>
             <input type="hidden" name="Date" value="${post.Date}"/>
            <label for="Category" class="form-label">Catégorie </label>
            <input
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                value="${post.Category}"
            />
            <label for="Title" class="form-label">Titre </label>
            <input
                class="form-control"
                name="Title"
                id="Title"
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal"
                value="${post.Title}"
            />
            <label for="Url" class="form-label">Texte</label>
             <textarea class="form-control"
                          name="Text"
                          id="Text"
                          placeholder="Texte"
                          rows="9"
                          required
                          RequireMessage = 'Veuillez entrer une Description'>${post.Text}</textarea>

            <label class="form-label">Image </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader'
                     newImage='${create}'
                     controlId='Image'
                     imageSrc='${post.Image}'
                     waitingImage="Loading_icon.gif">
                </div>
            </div>
            <div id="keepDateControl">
                <input type="checkbox" name="keepDate" id="keepDate" class="checkbox" checked>
                <label for="keepDate"> Conserver la date de création </label>
            </div>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary displayNone">
        </form>
    `);
  if (create) $("#keepDateControl").hide();

  initImageUploaders();
  initFormValidation(); // important do to after all html injection!

  $("#commit").click(function () {
    $("#commit").off();
    return $("#savePost").trigger("click");
  });
  $("#postForm").on("submit", async function (event) {
    event.preventDefault();
    const user = JSON.parse(sessionStorage.getItem("user"));
    let post = getFormData($("#postForm"));
    post.IdUserWhoPost = user.Id;
    if (post.Category != selectedCategory) selectedCategory = "";
    if (create || !("keepDate" in post)) post.Date = Local_to_UTC(Date.now());
    delete post.keepDate;
    post = await Posts_API.Save(post, create);
    if (!Posts_API.error) {
      await showPosts();
      postsPanel.scrollToElem(post.Id);
    } else showError("Une erreur est survenue! ", Posts_API.currentHttpError);
  });
  $("#cancel").on("click", async function () {
    await showPosts();
  });
}
function getFormData($form) {
  // prevent html injections
  const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
  var jsonObject = {};
  // grab data from all controls
  $.each($form.serializeArray(), (index, control) => {
    jsonObject[control.name] = control.value.replace(removeTag, "");
  });
  return jsonObject;
}
function renderInscription(user = null) {
  let create = user == null;
  let pw;
  if (create) {
    user = newUser();
  } else {
    pw = user.Password;
  }
  //sconsole.log(user.Password)
  $("#form").show();
  $("#form").empty();
  $("#form").append(`
        <form class="form" id="userForm">
        <input type="hidden" name="Id" value="${user.Id}"/>
        <input type="hidden" name="Created" value="${user.Created}"/>
        <input type="hidden" name="VerifyCode" value="${user.VerifyCode}"/>
        <label for="Name" class="form-label">nom </label>
            <input
                class="form-control"
                name="Name"
                id="Name"
                placeholder="nom"
                required
                RequireMessage="Veuillez entrer un nom"
                InvalidMessage="Le nom comporte un caractère illégal"
                value="${user.Name}"
            />
            <div>
            <label for="Email" class="form-label">Email </label>
            <input
                class="form-control"
                name="Email"
                id="Email"
                placeholder="couriel"
                required
                RequireMessage="Veuillez entrer un couriel"
                InvalidMessage="Le couriel comporte un caractère illégal"
                value="${user.Email}"
            />
            <input
                class="form-control"
                name="MatchedInput"
                id="ConfirmEmail"
                placeholder="verification"
                required
                value="${user.Email}"
                RequireMessage="Veuillez entrer une verification"
                InvalidMessage="La verification comporte un caractère illégal"
            />
            </div>

              <div>
            <label for="Password" class="form-label">mot de passe </label>
            <input
                class="form-control"
                name="Password"
                id="Password"
                placeholder="mot de pass"
                RequireMessage="Veuillez entrer un mot de pass"
                InvalidMessage="Le mot de pass comporte un caractère illégal"
                value=""
            />
            <input
                class="form-control"
                name="Password"
                id="ConfirmPassword"
                placeholder="verification"
                RequireMessage="Veuillez entrer un mot de pass"
                InvalidMessage="Le mot de pass comporte un caractère illégal"
                value=""
            />
            </div>


            <label class="form-label">Avatar </label>
            <div class='imageUploaderContainer'>
                <div class='imageUploader'
                     newImage='${create}'
                     controlId='Avatar'
                     imageSrc='${user.Avatar}'
                     waitingImage="Loading_icon.gif">
                </div>
            </div>
            <input type="submit" value="Enregistrer" id="saveUser">
        </form>
    `);
  initImageUploaders();
  initFormValidation(); // important do to after all html injection!
  const email = document.getElementById("Email");
  const confirmEmail = document.getElementById("ConfirmEmail");
  const pass = document.getElementById("Password");
  const confirmpass = document.getElementById("ConfirmPassword");

  $("#userForm").on("submit", async function (event) {
    event.preventDefault();
    if (email.value !== confirmEmail.value) {
      event.preventDefault();
      showError("confirmation couriel invalid");
    }
    if (pass.value !== confirmpass.value) {
      event.preventDefault();
      showError("confirmation mot de pass invalid");
    }

    let user = getFormData($("#userForm"));



    if (!create) {


      await Accounts_API.Modify(user);
    } else {
      user = await Accounts_API.Register(user, create);
    }

    if (!Accounts_API.error) {
      await showPosts();
    } else showError("Une erreur est survenue! ", Accounts_API.currentHttpError);
  });
}
function RenderConnexions() {
  $("#form").show();
  $("#form").empty();
  $("#form").append(`

        <form class="form" id="userForm">
        <div class="login-container">
            <h1>Connexion</h1>
            <form action="/login" method="post">
            <div class="form-group">
                <label for="email">Adresse e-mail</label>
                 <input
                class="form-control"
                name="Email"
                id="Email"
                placeholder="Email"
                required
                RequireMessage="Veuillez entrer votre Email"
                InvalidMessage="Le Email comporte un caractère illégal"
            />
            </div>
            <div class="form-group">
                <label for="password">Mot de passe</label>
                <input
                class="form-control"
                name="Password"
                id="Password"
                placeholder="mot de pass"
                required
                RequireMessage="Veuillez entrer un mot de pass"
                InvalidMessage="Le mot de pass comporte un caractère illégal"
            />
            </div>
            <button type="submit" class="btn">Se connecter</button>
        </div>
        </form>

    `);
  initFormValidation();
  $("#userForm").on("submit", async function (event) {
    event.preventDefault(); // Empêche la soumission normale du formulaire

    // Récupère les valeurs saisies dans le formulaire
    const email = $("#Email").val().trim();
    const password = $("#Password").val().trim();

    // Prépare les données pour l'API
    const val = {
      Email: email,
      Password: password,
    };

    // Appelle l'API de connexion
    const result = await Accounts_API.Login(val);

    // Affiche les résultats ou gère les erreurs
    if (result) {
     
      
      console.log(result.User.VerifyCode)
      updateDropDownMenu();
      if(result.User.VerifyCode=="verified"){
        await Accounts_API.SaveToken(result.Access_token);
        await Accounts_API.SaveUser(result.User);
        showPosts(true);
      }
      else{
        renderConfirmation(result.User,password);
      }
    } else {
      console.error("Erreur de connexion :", Accounts_API.currentHttpError);
      alert("Erreur de connexion : " + Accounts_API.currentHttpError);
    }
  });
}
function RenderDeconnexions() {
  $("#form").show();
  $("#form").empty();
  $("#form").append(`

          <form class="form" id="userForm">
          <div class="login-container">
                <h3>voulez-vous vraiment vous deconecter</h3>
              <button type="submit" class="btn" id >oui</button>
          </div>
          </form>

      `);
  initFormValidation();
  $("#cancel").on("click", async function () {
    await showPosts();
  });
  $("#userForm").on("submit", async function (event) {
    event.preventDefault();
    const user = JSON.parse(sessionStorage.getItem("user"));
    Accounts_API.RemoveUser();
    Accounts_API.RemoveToken();
    Accounts_API.deconection(user.id);
    showPosts();
  });
}
function renderConfirmation(user,password) {
  $("#form").show();
  $("#form").empty();
  $("#form").append(`

          <form class="form" id="userForm">
          <div class="login-container">
                <h3>entrer le code de verification</h3>
               <input
                class="form-control"
                name="code"
                id="code"
                placeholder="code"
                required
                RequireMessage="Veuillez entrer un code"
                InvalidMessage="Le code comporte un caractère illégal"
            />
              <button type="submit" class="btn" id >confirmer</button>
          </div>
          </form>

      `);
  initFormValidation();
  $("#cancel").on("click", async function () {
    await showPosts();
  });

  $("#userForm").on("submit", async function (event) {
    const code = document.getElementById("code").value;
    event.preventDefault(); // Empêche la soumission normale du formulaire
    const resultverif = await Accounts_API.verifycode(code,user.Id)
    console.log(resultverif)
    if(resultverif){
      const val = {
        Email: resultverif.Email,
        Password: password,
      };
      console.log(val)
      const result = await Accounts_API.Login(val);

      await Accounts_API.SaveToken(result.Access_token);
      await Accounts_API.SaveUser(result.User);
      showPosts(true);
    }

  });
}
