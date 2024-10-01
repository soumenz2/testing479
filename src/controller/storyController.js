const StoryModel=require('../model/storyModel.js')
const SlideModel=require('../model/slideModel.js')

const { randomUUID } =require('crypto');
const mongoose = require('mongoose');
const storyModel = require('../model/storyModel.js');
const slideModel = require('../model/slideModel.js');
const bookmarkModel=require('../model/bookmarkModel.js')
const Likemodel=require('../model/likeModel.js');
const likeModel = require('../model/likeModel.js');


const createStoryWithSlide=async(req,res)=>{
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { userID,  slides } = req.body;
        if (!userID || !slides || !Array.isArray(slides)) {
            throw new Error("Missing required fields or slides array is not valid");
        }
        if (slides.length < 3 && slides.length > 6) {
            throw new Error("story, min 3 slides are mandatory, max 6 slides are allowed ");
        }
        const storyCategory = slides[0].category;
        const newStory = new StoryModel({
            storyID: randomUUID(),
            userID,
            createdOn: Date.now(),
            category:storyCategory
          
        });
        await newStory.save({ session });
        const newSlide = slides.map((slide) => new SlideModel({
            slideID: randomUUID(),
            storyID:newStory.storyID,
            heading: slide.heading,
            description: slide.description,
            imageOrVideoURl: slide.imageOrVideoURl,
            category: slide.category,
            likeCount:0
        }));
        await SlideModel.insertMany(newSlide, { session });
        await session.commitTransaction();
        const createdStory = [];
        createdStory.push({
            ...newStory.toObject(),
            slides: newSlide.map(slide => slide.toObject())
        });
        res.status(201).json({ message: 'Story and slides created successfully!', data: createdStory });

    }
    catch(error){
        await session.abortTransaction();
        res.status(500).json({ error: error.message });

    } finally {
        session.endSession();
    }
}

// const getStoryByCategory = async (req, res) => {
//     try {
      
//         const { category } = req.query;
//         const query = category && category !== 'All' ? { category } : {};
//         console.log("Query:", query);  
        
//         const story=await StoryModel.find(query)
       

//         if (story.length===0) {
//             return res.status(404).json({ message: 'No story found ' });
//         }

//         // Fetch the associated options for each question
//         const storylist = await Promise.all(
//             story.map(async (str) => {
//                 const slides = await SlideModel.find({ storyID: str.storyID });
//                 return { ...str.toObject(),slide: slides.map(item=>item.toObject()) };
//             })
//         );

//         res.status(200).json({ data: storylist });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };
const getStoryByCategory = async (req, res) => {
  try {
    const { category, limit = 4 } = req.query; // Default limit to 4
    const limitInt = parseInt(limit);

    // Determine if we should filter by category
    const matchQuery = category && category !== 'All' ? { category } : {}; // Filter by category if not 'All'

    // Aggregation to get stories grouped by category
    const storyAggregation = [
      { $match: matchQuery }, 
      {
        $group: { // Group stories by category
          _id: "$category",
          stories: { $push: "$$ROOT" }, 
          totalCount: { $sum: 1 } 
        }
      },
      {
        $project: { // Return stories up to the limit
          stories: { $slice: ["$stories", limitInt] },
          category: "$_id",
          totalCount: 1 
        }
      }
    ];

    // Run the aggregation query
    const groupedStories = await StoryModel.aggregate(storyAggregation);

    // List of all categories you want to include
    const allCategories = ['Music', 'Movies', 'World', 'India'];

    // Create a map for the results
    const categoryMap = {};
    groupedStories.forEach(categoryGroup => {
      categoryMap[categoryGroup._id] = {
        stories: categoryGroup.stories,
        hasMore: categoryGroup.totalCount > limitInt
      };
    });

    // Fetch slides for each story
    const storylist = await Promise.all(allCategories.map(async (category) => {
      const data = categoryMap[category] || { stories: [], hasMore: false };
      
      // For each story, fetch the associated slides
      const storiesWithSlides = await Promise.all(data.stories.map(async (story) => {
        const slides = await SlideModel.find({ storyID: story.storyID });
        return { ...story, slides: slides.map(slide => slide.toObject()) }; // Include slides in the story object
      }));

      return {
        category,
        hasMore: data.hasMore,
        stories: storiesWithSlides
      };
    }));

    // Only return the complete storylist when 'All' is selected
    if (category === 'All') {
      res.status(200).json({ data: storylist });
    } else {
      // For specific categories, return only the matched category
      res.status(200).json({ data: [storylist.find(cat => cat.category === category)] });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserStory = async (req, res) => {
  try {
    const { userID, limit = 4 } = req.query; // Default limit to 4
    const limitInt = parseInt(limit);

    // Fetch user's stories
    const userStories = await storyModel.find({ userID });
    const totalCount = userStories.length; // Get the total count of user stories

    // Fetch only the limited number of stories
    const limitedUserStories = await storyModel.find({ userID }).limit(limitInt);
    
    // Fetch slides for each story
    const storiesWithSlides = await Promise.all(limitedUserStories.map(async (story) => {
      const slideData = await slideModel.find({ storyID: story.storyID });
      return { ...story.toObject(), slides: slideData }; // Include slides in the story object
    }));

    // Determine if there are more stories
    const hasMore = totalCount > limitInt;

    res.status(200).json({
      message: "User stories fetched successfully",
      data: storiesWithSlides,
      hasMore: hasMore // Indicates if there are more stories
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStorybyId=async (req,res)=>{
  try{
    const {storyID}=req.query;
    const storydata=await storyModel.findOne({storyID});
    const slideData=await slideModel.find({storyID});
    res.status(200).json({slides:slideData})

  }
  catch(error){
    res.status(500).json({error:error.message});
  }
 
}
const setbookmark=async(req,res)=>{
  try{
    const { userID,slideID}=req.body
    if (!userID || !slideID) {
      throw new Error("Missing required fields ");
  }
const newBookmarkModel=new bookmarkModel({
  bookmarkID:randomUUID(),
  slideID,
  userID
})
await newBookmarkModel.save()
res.status(200).json({message:"bookmark Added Succesfully",data:newBookmarkModel})



  }
  catch(error){
    res.status(500).json({error:error.message})
  }
  
}
const resetBookmarkById=async(req,res)=>{
  try {
    const { slideID,userID } = req.body; 



    const result = await Likemodel.findOneAndDelete({ userID, slideID });
 
    if (result) {
      return res.status(200).json({ message: 'Bookmark removed  successful' });
    } else {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
const getbookmarkbyId = async (req, res) => {
  try {
    const { userID } = req.query;
    const bookmarkList = await bookmarkModel.find({ userID });
    console.log(bookmarkList);

    const bookmarkDetailList = await Promise.all(
      bookmarkList.map(async (bookmark) => {
        const bookmarkSlide = await slideModel.findOne({ slideID: bookmark.slideID });
        console.log("data in map: ", bookmarkSlide);
        
        // Return only bookmarkSlide
        return bookmarkSlide;
      })
    );

    res.status(200).json({ message: "Bookmark data fetched successfully", data: bookmarkDetailList });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const isbookmarked =async(req,res)=>{
  try {
    const { slideID ,userID} = req.query; 
    

    const bookmark = await bookmarkModel.findOne({ userID, slideID });
    if (bookmark) {
      return res.status(200).json({ isBookmarked: true });
    } else {
      return res.status(200).json({ isBookmarked: false });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }

}
const isLikedslides=async(req,res)=>{
  try {
    const { slideID ,userID} = req.query; 
    

    const like = await Likemodel.findOne({ userID, slideID });
    if (like) {
      return res.status(200).json({ isLiked: true });
    } else {
      return res.status(200).json({ isLiked: false });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }

}
const bookmarklides=async(req,res)=>{

  try {
    const { slideID,userID } = req.body;

    const existingBookmark = await bookmarkModel.findOne({ userID, slideID });
    console.log(existingBookmark)
    if (existingBookmark) {
      return res.status(400).json({ message: 'You have already bookmarked this slides.' });
    }

    
    const newBookmark = new bookmarkModel({ 
      bookmarkID:randomUUID(),
      userID,
      slideID
     });
    await newBookmark.save();


    return res.status(200).json({ message: 'Bookmark saved successfully',data:newBookmark });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
const undoBookmarkSlides=async(req,res)=>{
  try {
    const { slideID,userID } = req.body; 



    const result = await bookmarklides.findOneAndDelete({ userID, slideID });

    if (result) {
      return res.status(200).json({ message: 'Undo bookmark  successfully'});
    } else {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
const likeslides=async(req,res)=>{

  try {
    const { slideID,userID } = req.body;

    const existingLike = await Likemodel.findOne({ userID, slideID });
    console.log(existingLike)
    if (existingLike) {
      return res.status(400).json({ message: 'You have already liked this story.' });
    }

    
    const newLike = new Likemodel({ 
      likeID:randomUUID(),
      userID,
      slideID
     });
    await newLike.save();

    // Optionally, update the story's like count (if using embedded document)
    const slides=await slideModel.findOne({slideID});
    slides.likeCount +=1;
    await slides.save()

    return res.status(200).json({ message: 'Story liked successfully',data:slides });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
const unlikeSlides=async(req,res)=>{
  try {
    const { slideID,userID } = req.body; 



    const result = await Likemodel.findOneAndDelete({ userID, slideID });
    console.log(result)
    const slides=await slideModel.findOne({slideID});
    slides.likeCount -=1;
    await slides.save()


    if (result) {
      return res.status(200).json({ message: 'Unlike successful',data:slides });
    } else {
      return res.status(404).json({ error: 'Like not found' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

const updateStory = async (req, res) => {
  try {
    const { slides } = req.body;
    console.log(slides)
    if (!slides || slides.length === 0) {
      return res.status(400).json({ message: "No slides provided" });
    }

    // Find the existing slides based on the first slide's slideID
    const storyId=slides[0].storyID;
    const slideData = await slideModel.find({ storyID:storyId });

    const storyPreviousLength = slideData.length; 
    const storyCurrentlength = slides.length; 


    for (let i = 0; i < storyPreviousLength; i++) {
      await slideModel.updateOne(
        { slideID: slides[i].slideID }, // Match by slideID
        { $set: slides[i] } // Update with the new slide data
      );
    }

    // Insert new slides one by one into SlideModel
    if (storyCurrentlength > storyPreviousLength) {
      const newSlides = slides.slice(storyPreviousLength); // Get only new slides

      for (const newSlide of newSlides) {
        const slide = new slideModel({
          slideID:randomUUID(),
          storyID:storyId,
          heading:newSlide.heading,
          description:newSlide.description,
          imageOrVideoURl:newSlide.imageOrVideoURl,
          category:newSlide.category,
          likeCount:0


        }); // Create a new instance of SlideModel
        await slide.save(); // Save each new slide to the database
      }
    }

    res.status(200).json({ message: "Slides updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while updating the slides" });
  }
};





module.exports={
    createStoryWithSlide,
    getStoryByCategory,
    getStorybyId,
    setbookmark,
    getbookmarkbyId,
    isbookmarked,
    isLikedslides,
    unlikeSlides,
    likeslides,
    getUserStory,
    updateStory,
    bookmarklides,
    undoBookmarkSlides
}
