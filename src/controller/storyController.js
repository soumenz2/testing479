const StoryModel=require('../model/storyModel.js')
const SlideModel=require('../model/slideModel.js')

const { randomUUID } =require('crypto');
const mongoose = require('mongoose');
const storyModel = require('../model/storyModel.js');
const slideModel = require('../model/slideModel.js');


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
      { $match: matchQuery }, // Filter by category
      {
        $group: { // Group stories by category
          _id: "$category",
          stories: { $push: "$$ROOT" }, // Push all stories into an array under each category
          totalCount: { $sum: 1 } // Count the total number of stories in each category
        }
      },
      {
        $project: { // Return stories up to the limit
          stories: { $slice: ["$stories", limitInt] },
          category: "$_id",
          totalCount: 1 // Include totalCount in the response
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





module.exports={
    createStoryWithSlide,
    getStoryByCategory,
    getStorybyId
}
