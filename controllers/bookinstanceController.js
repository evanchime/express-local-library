// JavaScript source code
var BookInstance = require('../models/bookinstance');
var Book = require('../models/book');
var async = require('async');
var debug = require('debug')('bookinstance');

// Display list of all BookInstances
exports.bookinstance_list = function(req, res, next) {
    
      BookInstance.find()
        .populate('book')
        .exec(function (err, list_bookinstances) {
          if (err) { return next(err); }
          //Successful, so render
          res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
        });
        
    };

// Display detail page for a specific BookInstance
exports.bookinstance_detail = function (req, res) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function (err, bookinstance) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('bookinstance_detail', { title: 'Book:', bookinstance: bookinstance });
    });
};

// Display BookInstance create form on GET
exports.bookinstance_create_get = function (req, res) {
    Book.find({},'title')
    .exec(function (err, books) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books});
    });
};

// Handle BookInstance create on POST
exports.bookinstance_create_post = function (req, res) {
    req.checkBody('book', 'Book must be specified').notEmpty(); //We won't force Alphanumeric, because book titles might have spaces.
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();
    
    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();   
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();
    
    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint, 
        status: req.body.status,
        due_back: req.body.due_back
    });

    var errors = req.validationErrors();
    if (errors) {
        
        Book.find({},'title')
        .exec(function (err, books) {
          if (err) { return next(err); }
          //Successful, so render
          res.render('bookinstance_form', 
          { title: 'Create BookInstance', book_list : books, book_status: bookinstance.status, 
          selected_book : bookinstance.book._id , errors: errors, bookinstance:bookinstance });
        });
        return;
    } 
    else {
    // Data from form is valid
    
        bookinstance.save(function (err) {
            if (err) { return next(err); }
               //successful - redirect to new book-instance record.
               res.redirect(bookinstance.url);
            }); 
    }
};

// Display BookInstance delete form on GET
exports.bookinstance_delete_get = function (req, res) {
    BookInstance.findById(req.params.id)
    .exec(function(err, results) {
        if (err) { return next(err); }
        //Successful, so render
        res.render('bookinstance_delete', { title: 'Delete Bookinstance', bookinstance: results } );
    });
};

// Handle BookInstance delete on POST
exports.bookinstance_delete_post = function (req, res) {
    req.checkBody('bookinstanceid', 'bookinstance id must exist').notEmpty(); 
    BookInstance.findByIdAndRemove(req.body.bookinstanceid, function deletebookinstance(err) {
       if (err) { return next(err); }
       //Success - got to bookinstance list
       res.redirect('/catalog/bookinstances');
   });
};

// Display BookInstance update form on GET
exports.bookinstance_update_get = function (req, res) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();
    
    //Get bookinstance and books for form
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).populate('book').exec(callback);
        },
        books: function(callback) {
            Book.find(callback);
        },
    }, function(err, results) {
        if (err) { return next(err); }
        res.render('bookinstance_form', { title: 'Update Bookinstance', book_list: results.books, 
        bookinstance: results.bookinstance, book_status: results.bookinstance.status });
    });
};

// Handle bookinstance update on POST
exports.bookinstance_update_post = function (req, res) {
    req.sanitize('id').escape();
    req.sanitize('id').trim();
//Sanitize id passed in. 
    req.checkBody('book', 'Book must be specified').notEmpty(); //We won't force Alphanumeric, because book titles might have spaces.
    req.checkBody('imprint', 'Imprint must be specified').notEmpty();
    req.checkBody('due_back', 'Invalid date').optional({ checkFalsy: true }).isDate();

    req.sanitize('book').escape();
    req.sanitize('imprint').escape();
    req.sanitize('status').escape();
    req.sanitize('book').trim();
    req.sanitize('imprint').trim();   
    req.sanitize('status').trim();
    req.sanitize('due_back').toDate();

    var bookinstance = new BookInstance({
        book: req.body.book,
        imprint: req.body.imprint, 
        status: req.body.status,
        due_back: req.body.due_back,
        _id:req.params.id //This is required, or a new ID will be assigned!
    });

    var errors = req.validationErrors();
    if (errors) {
        // Re-render book with error information
        // Get all books and genres for form
        async.parallel({
            books: function(callback) {
                Book.find(callback);
            },
        }, function(err, results) {
            if (err) { return next(err); }
            res.render('bookinstance_form', { title: 'Update BookInstance', book_list:results.books, 
            book_status: bookinstance.status, bookinstance: bookinstance, errors: errors });
        });

    } 
    else {
        // Data from form is valid. Update the record.
        BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {}, function (err,thebookinstance) {
            if (err) { return next(err); }
            //successful - redirect to bookinstance detail page.
            res.redirect(thebookinstance.url);
        });
        
    }
};