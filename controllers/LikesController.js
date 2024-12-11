import LikeModel from '../models/like.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';

export default class LikesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new LikeModel()));
    }
    // POST: Likes/LikeThat 
    likethat(likes) {
        console.log("passeLikeThat")
        if (this.repository != null) {
           
           
         
            let like = this.repository.add(likes);
            if (this.repository.model.state.isValid) {
                this.HttpContext.response.created(like);
              
            } else {
                if (this.repository.model.state.inConflict)
                    this.HttpContext.response.conflict(this.repository.model.state.errors);
                else
                    this.HttpContext.response.badRequest(this.repository.model.state.errors);
            }
        } else
            this.HttpContext.response.notImplemented();
    }
       // PUT: Likes/UpdateLike/:id
       updatelike( updatedData) {
        console.log("passeUpdateLike");
        if (this.repository != null) {
            let updatedLike = this.repository.update(this.HttpContext.path.id , updatedData);
            if (this.repository.model.state.isValid) {
                this.HttpContext.response.JSON(updatedLike);
            } else {
                if (this.repository.model.state.notFound)
                    this.HttpContext.response.notFound(this.repository.model.state.errors);
                else
                    this.HttpContext.response.badRequest(this.repository.model.state.errors);
            }
        } else {
            this.HttpContext.response.notImplemented();
        }
    }

    // GET: Likes/FindLike/:field/:value
    findlike( value) {
        console.log("passeFindLike");
        if (this.repository != null) {
            let like = this.repository.findByFilter((like) => like.IdPost == value);
            if (like) {
                this.HttpContext.response.JSON(like);
            } else {
                this.HttpContext.response.notFound({ message: `No like found with  ${value}` });
            }
        } else {
            this.HttpContext.response.notImplemented();
        }
    }

}