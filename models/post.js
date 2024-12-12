import Model from "./model.js";
import Repository from "./repository.js";
import Like from "./like.js";
import User from "./user.js";
export default class Post extends Model {
  constructor() {
    super(true /* secured Id */);

    this.addField("Title", "string");
    this.addField("Text", "string");
    this.addField("Category", "string");
    this.addField("Image", "asset");
    this.addField("Date", "integer");
    this.addField("IdUserWhoPost", "string");
    this.setKey("Title");
  }
  bindExtraData(instance) {
    instance = super.bindExtraData(instance);
    let LikeRepository = new Repository(new Like());

    let UserRepository = new Repository(new User());

    let  userOwners=null;
    instance.test =instance.IdUserWhoPost; 
    if(instance.IdUserWhoPost){
        instance.userOwners  = UserRepository.findByField("Id", instance.IdUserWhoPost);
        
    }
     

    instance.postID =  instance.Id;
    let alluser = UserRepository.getAll();
    let likedUserNames = null;
    let TheLike = LikeRepository.findByField("IdPost", instance.Id);

    instance.like = TheLike;
    if (TheLike) {
      likedUserNames = alluser
        .filter((user) => TheLike.ListOfUserLike.includes(user.Id))
        .map((user) => user.Name);
    }

    if (likedUserNames) {
      instance.listename = likedUserNames;
    } else {
      instance.listename = null;
    }

    return instance;
  }
  /////////////////////////////////////////////////////////////////////
}
