class Likes_API {
  static Host_URL() {
    return "http://localhost:5000";
  }
  static API_URL() {
    return this.Host_URL() + "/likes";
  }
  static Likes_URL() {
    return this.Host_URL() + "/likes/likethat";
  }
  static UpdateLike_URL() {
    return this.Host_URL() + "/likes/updatelike";
  } // URL pour mise à jour
  static FindLike_URL() {
    return this.Host_URL() + "/likes/findlike";
  } // URL pour recherche

  static initHttpState() {
    this.currentHttpError = "";
    this.currentStatus = 0;
    this.error = false;
  }

  static setHttpErrorState(xhr) {
    if (xhr.responseJSON)
      this.currentHttpError = xhr.responseJSON.error_description;
    else
      this.currentHttpError =
        xhr.statusText === "error" ? "Service introuvable" : xhr.statusText;
    this.currentStatus = xhr.status;
    this.error = true;
  }

  static async HEAD() {
    Likes_API.initHttpState();
    return new Promise((resolve) => {
      $.ajax({
        url: this.API_URL(),
        type: "HEAD",
        contentType: "text/plain",
        complete: (data) => {
          resolve(data.getResponseHeader("ETag"));
        },
        error: (xhr) => {
          Likes_API.setHttpErrorState(xhr);
          resolve(null);
        },
      });
    });
  }

  // Nouvelle fonction pour mettre à jour un "like"
  static async UpdateLike(id, updatedData) {
    console.log(updatedData);
    Likes_API.initHttpState();
    return new Promise((resolve) => {
      $.ajax({
        url: `${this.UpdateLike_URL()}/${id}`, // Appel de l'URL dédiée
        type: "PUT",
        contentType: "application/json",
        data: JSON.stringify(updatedData),
        success: (data) => {
          resolve(data);
        },
        error: (xhr) => {
          Likes_API.setHttpErrorState(xhr);
          resolve(null);
        },
      });
    });
  }

  // Nouvelle fonction pour rechercher un "like"
  static FindLike( value) {
    Likes_API.initHttpState();
    let result = null;

    $.ajax({
      url: `${this.FindLike_URL()}/${value}`, // Appel de l'URL dédiée
      type: "GET",
      async: false, // Appel synchrone
      success: (data) => {
        result = data;
      },
      error: (xhr) => {
        Likes_API.setHttpErrorState(xhr);
      },
    });

    return result;
  }

  static async Get(id = null) {
    Likes_API.initHttpState();
    return new Promise((resolve) => {
      $.ajax({
        url: this.API_URL() + (id != null ? "/" + id : ""),
        complete: (data) => {
          resolve({
            ETag: data.getResponseHeader("ETag"),
            data: data.responseJSON,
          });
        },
        error: (xhr) => {
          Likes_API.setHttpErrorState(xhr);
          resolve(null);
        },
      });
    });
  }

  static async GetQuery(queryString = "") {
    Likes_API.initHttpState();
    return new Promise((resolve) => {
      $.ajax({
        url: this.API_URL() + queryString,
        complete: (data) => {
          resolve({
            ETag: data.getResponseHeader("ETag"),
            data: data.responseJSON,
          });
        },
        error: (xhr) => {
          Likes_API.setHttpErrorState(xhr);
          resolve(null);
        },
      });
    });
  }

  static async Save(data, create = true) {
    Likes_API.initHttpState();
    return new Promise((resolve) => {
      $.ajax({
        url: this.Likes_URL(),
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(data),
        success: (data) => {
          resolve(data);
        },
        error: (xhr) => {
          Likes_API.setHttpErrorState(xhr);
          resolve(null);
        },
      });
    });
  }

  static async Delete(id) {
    return new Promise((resolve) => {
      $.ajax({
        url: this.API_URL() + "/" + id,
        type: "DELETE",
        complete: () => {
          Likes_API.initHttpState();
          resolve(true);
        },
        error: (xhr) => {
          Likes_API.setHttpErrorState(xhr);
          resolve(null);
        },
      });
    });
  }

  static async ILikeThat(idPost, IdUserWhoLikeThePost) {
    // Recherche un like existant pour le post
    console.log(idPost);
    const existingLike = Likes_API.FindLike( idPost);
   
    if (existingLike.length == 0) {
      // Aucun like trouvé, création d'un nouveau
      let Like = Likes_API.newLike(idPost, IdUserWhoLikeThePost);
      console.log("Création d'un nouveau like :", Like);

      const response = await Likes_API.Save(Like, true); // Sauvegarde du like
      if (response) {
        console.log("Like enregistré avec succès !");
      } else {
        console.log("Erreur lors de l'enregistrement du like.");
      }
    } else {
      // Like trouvé, mise à jour de la liste des utilisateurs
      const userIndex =
        existingLike[0].ListOfUserLike.indexOf(IdUserWhoLikeThePost);

      if (userIndex === -1) {
        // L'utilisateur n'est pas dans la liste, ajout de son ID
        existingLike[0].ListOfUserLike.push(IdUserWhoLikeThePost);
        console.log(
          `Utilisateur ${IdUserWhoLikeThePost} ajouté au like :`,
          existingLike[0]
        );
      } else {
        // L'utilisateur est déjà dans la liste, suppression de son ID
        existingLike[0].ListOfUserLike.splice(userIndex, 1);
        console.log(
          `Utilisateur ${IdUserWhoLikeThePost} retiré du like :`,
          existingLike[0]
        );
      }
      console.log(existingLike[0]);
      // Mise à jour du like avec la nouvelle liste
      const response = await Likes_API.UpdateLike(
        existingLike[0].Id,
        existingLike[0]
      );
      if (response) {
        console.log("Like mis à jour avec succès !");
      } else {
        console.log("Erreur lors de la mise à jour du like.");
      }
    }
  }

  static newLike(idPost, IdUserWhoLikeThePost) {
    let Like = {};
    Like.Id = 0;
    Like.IdPost = idPost;
    Like.ListOfUserLike = [IdUserWhoLikeThePost];
    return Like;
  }
}
