class Likes_API {
    static Host_URL() { return "http://localhost:5000"; }
    static API_URL() { return this.Host_URL() + "/likes" };
    static Likes_URL() { return "http://localhost:5000/likes/LikeThat" };
    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
    }
    static setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            this.currentHttpError = xhr.responseJSON.error_description;
        else
            this.currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        this.currentStatus = xhr.status;
        this.error = true;
    }
    static async HEAD() {
        Likes_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL(),
                type: 'HEAD',
                contentType: 'text/plain',
                complete: data => { resolve(data.getResponseHeader('ETag')); },
                error: (xhr) => { Likes_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Get(id = null) {
        Likes_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + (id != null ? "/" + id : ""),
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Likes_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async GetQuery(queryString = "") {
        Likes_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + queryString,
                complete: data => {
                    resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON });
                },
                error: (xhr) => {
                    Likes_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async Save(data, create = true) {
        Likes_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.Likes_URL() ,
                type: "POST",
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { Likes_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Delete(id) {
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + "/" + id,
                type: "DELETE",
                complete: () => {
                    Likes_API.initHttpState();
                    resolve(true);
                },
                error: (xhr) => {
                    Likes_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async ILikeThat(idPost, IdUserWhoLikeThePost) {
        console.log(idPost);
        console.log(IdUserWhoLikeThePost);
    
      
        const likeData = {
            IdPost: idPost,
            ListOfUserLike: [IdUserWhoLikeThePost], // Liste d'utilisateurs qui ont liké
        };
    
        // Sauvegarder l'objet "Like" en utilisant la méthode Save
        const response = await Likes_API.Save(likeData, true); // true pour créer un nouveau like
        if (response) {
            console.log("Like enregistré avec succès !");
        } else {
            console.log("Erreur lors de l'enregistrement du like.");
        }
    }
}