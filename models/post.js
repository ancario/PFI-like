import Model from './model.js';
import Repository from './repository.js';
import Like from './like.js';
import User from './user.js';
export default class Post extends Model {
    constructor() {
        super(true /* secured Id */);

        this.addField('Title', 'string');
        this.addField('Text', 'string');
        this.addField('Category', 'string');
        this.addField('Image', 'asset');
        this.addField('Date', 'integer');

        this.setKey("Title");
    }
    bindExtraData(instance){

        instance=super.bindExtraData(instance);
    //     let LikeRepository = new Repository(new Like());

    //     let UserRepository = new Repository(new User());

    //     let alluser = UserRepository.getAll();

    //     let TheLike = LikeRepository.findByField("IdPost",instance.id);

    //     const likedUserNames =  alluser
    //    .filter(user => TheLike.ListOfUserLike.includes(user.Id)) 
    //     .map(user => user.Name); // Extraire les noms

    //     if(!likedUserNames){
    //         instance.listename = likedUserNames;
    //     }
    //     else{
    //         instance.listename = "test pas de user" ;
    //     }
       
      return instance
    }
    /////////////////////////////////////////////////////////////////////
   
    
 
}