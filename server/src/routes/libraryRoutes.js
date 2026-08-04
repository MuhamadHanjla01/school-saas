const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Get all books
router.get('/', async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      where: { schoolId: req.tenant.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Create a book
router.post('/', async (req, res) => {
  try {
    const { bookId, title, author, category } = req.body;
    const book = await prisma.book.create({
      data: {
        bookId,
        title,
        author,
        category,
        schoolId: req.tenant.id
      }
    });
    res.status(201).json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// Update book (e.g. Issue or Return)
router.put('/:id', async (req, res) => {
  try {
    const { status, issuedTo, dueDate } = req.body;
    const book = await prisma.book.update({
      where: { id: req.params.id },
      data: { status, issuedTo, dueDate: dueDate ? new Date(dueDate) : null }
    });
    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// Delete book
router.delete('/:id', async (req, res) => {
  try {
    await prisma.book.delete({ where: { id: req.params.id } });
    res.json({ message: 'Book deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

module.exports = router;
