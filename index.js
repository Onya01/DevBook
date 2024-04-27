const fs = require('fs');
const express = require('express');
const app = express();

app.use(express.json());

// Data storage files
const usersFile = 'users.json';
const booksFile = 'books.json';

// Check if files exist, if not create them
if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]');
}

if (!fs.existsSync(booksFile)) {
    fs.writeFileSync(booksFile, '[]');
}

// Routes for Users
app.post('/users/create', (req, res) => {
    const newUser = req.body;
    const users = JSON.parse(fs.readFileSync(usersFile));
    users.push(newUser);
    fs.writeFileSync(usersFile, JSON.stringify(users));
    res.json(newUser);
});

app.post('/users/authenticate', (req, res) => {
    const { email, password } = req.body;

    // Load users data
    const users = JSON.parse(fs.readFileSync(usersFile));

    // Find the user with the provided email
    const user = users.find(u => u.email === email);

    // If user is not found or password doesn't match, return authentication failed
    if (!user || user.password !== password) {
        return handleError(res, 401, 'Authentication failed');
    }

    // If authentication is successful, return user data
    res.json({
        id: user.id,
        name: user.name,
        email: user.email
    });
});


app.get('/users', (req, res) => {
    const users = JSON.parse(fs.readFileSync(usersFile));
    res.json(users);
});

// Routes for Books
app.post('/books/create', (req, res) => {
    const newBook = req.body;
    const books = JSON.parse(fs.readFileSync(booksFile));
    books.push(newBook);
    fs.writeFileSync(booksFile, JSON.stringify(books));
    res.json(newBook);
});

app.delete('/books/:id', (req, res) => {
    const bookId = req.params.id;
    let books = JSON.parse(fs.readFileSync(booksFile));
    books = books.filter(book => book.id !== bookId);
    fs.writeFileSync(booksFile, JSON.stringify(books));
    res.send('Book deleted');
});

app.post('/books/loanout', (req, res) => {
    const { bookId, userId } = req.body;

    // Load books data
    let books = JSON.parse(fs.readFileSync(booksFile));

    // Find the book with the provided ID
    const bookIndex = books.findIndex(book => book.id === bookId);

    // If book is not found, return 404 Not Found
    if (bookIndex === -1) {
        return handleError(res, 404, 'Book not found');
    }

    const book = books[bookIndex];

    // Check if the book is available for loan
    if (!book.available) {
        return handleError(res, 400, 'Book is not available for loan');
    }

    // Update the book status to loaned out
    books[bookIndex].available = false;
    books[bookIndex].borrower = userId; // You might want to store the borrower ID or details here

    // Write updated books data back to file
    fs.writeFileSync(booksFile, JSON.stringify(books));

    res.json({ message: 'Book successfully loaned out' });
});


app.post('/books/return', (req, res) => {
    const { bookId } = req.body;

    // Load books data
    let books = JSON.parse(fs.readFileSync(booksFile));

    // Find the book with the provided ID
    const bookIndex = books.findIndex(book => book.id === bookId);

    // If book is not found, return 404 Not Found
    if (bookIndex === -1) {
        return handleError(res, 404, 'Book not found');
    }

    const book = books[bookIndex];

    // Check if the book was loaned out
    if (book.available) {
        return handleError(res, 400, 'Book is not loaned out');
    }

    // Update the book status to available
    books[bookIndex].available = true;
    books[bookIndex].borrower = null; // Clear borrower information

    // Write updated books data back to file
    fs.writeFileSync(booksFile, JSON.stringify(books));

    res.json({ message: 'Book successfully returned' });
});


app.put('/books/update', (req, res) => {
    const { id, title, author, description } = req.body;

    // Load books data
    let books = JSON.parse(fs.readFileSync(booksFile));

    // Find the index of the book with the provided ID
    const bookIndex = books.findIndex(book => book.id === id);

    // If book is not found, return 404 Not Found
    if (bookIndex === -1) {
        return handleError(res, 404, 'Book not found');
    }

    // Update the book's properties with the new values
    if (title) {
        books[bookIndex].title = title;
    }
    if (author) {
        books[bookIndex].author = author;
    }
    if (description) {
        books[bookIndex].description = description;
    }

    // Write updated books data back to file
    fs.writeFileSync(booksFile, JSON.stringify(books));

    res.json({ message: 'Book successfully updated' });
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
