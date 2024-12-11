import LikeModel from '../models/like.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';

export default class LikesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new LikeModel()));
    }
    // POST: Likes/LikeThat 
    LikeThat(like) {
        console.log("passeLikeThat")
        if (this.repository != null) {
            like.Created = utilities.nowInSeconds();
            let verifyCode = utilities.makeVerifyCode(6);
            like.VerifyCode = verifyCode;
            like.Authorizations = AccessControl.user();
            let newUser = this.repository.add(like);
            if (this.repository.model.state.isValid) {
                this.HttpContext.response.created(newUser);
              
            } else {
                if (this.repository.model.state.inConflict)
                    this.HttpContext.response.conflict(this.repository.model.state.errors);
                else
                    this.HttpContext.response.badRequest(this.repository.model.state.errors);
            }
        } else
            this.HttpContext.response.notImplemented();
    }

}