const Library = require("../Models/LibraryModel");
const { client } = require('../Utils/redisClient'); 
const { validateInput, ErrorResponse } = require("../Utils/validateInput");
const cloudinary = require('../Config/CloudinaryConfig');  



exports.createLibrary = async (req, res) => {

    try {
        const { book_name, author, page_num, department_id } = req.body;
       
        if (!book_name || !author || !page_num || !department_id || !req.file) {
            return res.status(400).json(
                ErrorResponse("Validation failed", [
                    "All fields (book_name, author, page_num, department_id) are required",
                ])
            );
        }
        const file_book = req.file.filename;

        if (!req.file) {
            return res.status(400).json(
                ErrorResponse("Validation failed", ["File upload is required"])
            );
        }
     
        console.log("Uploaded file details:", req.file);
        

       
        const newLibrary = await Library.create({
            book_name,
            author,
            page_num,
            file_book,
            department_id,
        });

        
        return res.status(201).json({
            message: 'The Create Library is Successfully',
            library: newLibrary,
        });
    } catch (error) {
        console.error("Error while creating Library entry:", error);
        return res.status(500).json(
            ErrorResponse("Failed to create Library entry", [
                error.message || "An unexpected error occurred.",
            ])
        );
    }
};
  
  
  
exports.getByFile = async (req, res) => {
    const fileName = req.params.filename;

    console.log('Received filename:', fileName);

    try {
      
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: '', 
        });

        console.log('Cloudinary resources:', result);

  try {
      const { book_name, author, page_num, department_id } = req.body;
     
      if (!book_name || !author || !page_num || !department_id || !req.file) {
          return res.status(400).json(
              ErrorResponse("Validation failed", [
                  "All fields (book_name, author, page_num, department_id) are required",
              ])
          );
      }
      const file_book = req.file.filename;

      if (!req.file) {
          return res.status(400).json(
              ErrorResponse("Validation failed", ["File upload is required"])
          );
      }
   
      console.log("Uploaded file details:", req.file);
      

     
      const newLibrary = await Library.create({
          book_name,
          author,
          page_num,
          file_book,
          department_id,
      });

      
      return res.status(201).json({
          message: 'The Create Library is Successfully',
          library: newLibrary,
      });
  } catch (error) {
      console.error("Error while creating Library entry:", error);
      return res.status(500).json(
          ErrorResponse("Failed to create Library entry", [
              error.message || "An unexpected error occurred.",
          ])
      );
  }
};
  
  


       
        const file = result.resources.find(resource => resource.public_id === fileName);

        if (!file) {
            console.log('File not found in Cloudinary');
            return res.status(404).json({ message: 'File not found' });
        }

        console.log('Found file:', file);

        
        res.setHeader('Content-Type', 'application/pdf');
        
        
        res.redirect(file.secure_url); 

    } catch (error) {
        console.error('Error fetching file from Cloudinary:', error);
        res.status(500).json({ message: 'Failed to retrieve file from Cloudinary' });
    }
};

exports.getLibrary = async (req, res) => {
  try {
    await client.del("library:all");

    const data = await client.get("library:all");

    if (data) {
      return res.status(200).json(JSON.parse(data)); 
    } else {
      const libraryEntries = await Library.findAll({
        attributes: ['id', 'book_name', 'author', 'page_num', 'file_book', 'department_id'],
        order: [['id', 'DESC']],
      });

      await client.setEx("library:all", 3600, JSON.stringify(libraryEntries));

      res.status(200).json(libraryEntries);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to fetch library entries", ["An error occurred while fetching the entries"]));
  }
};

exports.getLibraryById = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await client.get(`library:${id}`);

    if (data) {
      return res.status(200).json(JSON.parse(data));
    } else {
      const libraryEntry = await Library.findOne({
        attributes: ['id', 'book_name', 'author', 'page_num', 'file_book', 'department_id'],
        where: { id },
      });

      if (!libraryEntry) {
        return res.status(404).json(new ErrorResponse("Library entry not found", ["No library entry found with the given id"]));
      }

      await client.set(`library:${id}`, JSON.stringify(libraryEntry), {
        EX: 3600,
      });

      res.status(200).json(libraryEntry);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to fetch library entry", ["An error occurred while fetching the entry"]));
  }
};

exports.updateLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const { book_name, author, page_num, file_book, department_id } = req.body;

    const validationErrors = validateInput({ book_name, author, page_num, file_book, department_id });
    if (validationErrors.length > 0) {
      return res.status(400).json(ErrorResponse("Validation failed", validationErrors));
    }

    const libraryEntry = await Library.findByPk(id, {
      attributes: ['id', 'book_name', 'author', 'page_num', 'file_book', 'department_id'],
    });

    if (!libraryEntry) {
      return res.status(404).json(ErrorResponse("Library entry not found", ["No library entry found with the given id"]));
    }

    libraryEntry.book_name = book_name || libraryEntry.book_name;
    libraryEntry.author = author || libraryEntry.author;
    libraryEntry.page_num = page_num || libraryEntry.page_num;
    libraryEntry.file_book = file_book || libraryEntry.file_book;
    libraryEntry.department_id = department_id || libraryEntry.department_id;

    await libraryEntry.save();

    client.setex(`library:${id}`, 3600, JSON.stringify(libraryEntry));

    res.status(200).json({
      message: "Library entry updated successfully",
      libraryEntry,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json(new ErrorResponse("Failed to update library entry", ["An error occurred while updating the entry"]));
  }
};

exports.deleteLibrary = async (req, res) => {
  try {
    const { id } = req.params;

    const libraryEntry = await Library.findByPk(id, {
      attributes: ['id', 'book_name', 'author', 'page_num', 'file_book', 'department_id'],
    });

    if (!libraryEntry) {
      return res.status(404).json(new ErrorResponse("Library entry not found", ["No library entry found with the given id"]));
    }

    await libraryEntry.destroy();

    client.del(`library:${id}`);

    res.status(200).json({ message: "Library entry deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json(ErrorResponse("Failed to delete library entry", ["An error occurred while deleting the entry"]));
  }
};
