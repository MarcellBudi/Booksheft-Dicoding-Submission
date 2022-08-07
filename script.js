const books = [];
let filterBooks = [];
const RENDER_EVENT = "render";
let searchMode = false;
const SAVED_EVENT = "saved-books";
const STORAGE_KEY = "SAVED_BOOKS";

document.addEventListener("DOMContentLoaded", function () {
  const inputBook = document.getElementById("inputBook");
  const inputSearchBook = document.getElementById("searchBook");
  inputBook.addEventListener('submit', function (event) {
    event.preventDefault();
    searchMode = false;
    inputSearchBook.reset();
    addBook();
    inputBook.reset();
  });

  inputSearchBook.addEventListener('submit', function (event) {
    event.preventDefault();
    inputBook.reset();
    filterBooks = [];
    const judulBuku = document.getElementById("cari").value;
    if (judulBuku === "") {
      searchMode = false;
    } else {
      searchMode = true;
      searchBook(judulBuku);
      console.log(searchMode);
    }
    document.dispatchEvent(new Event(RENDER_EVENT));
  });

  if (isStorageExist()) {
    loadDataFromStorage();
  }
});

function addBook() {
  const getTitle = document.getElementById("judul").value;
  const getAuthor = document.getElementById("penulis").value;
  const getYear = document.getElementById("tahun").value;
  const getIsComplete = document.getElementById("inputBookIsComplete").checked;

  const id = generateId();
  const bookObject = generateBookObject(id, getTitle, getAuthor, getYear, getIsComplete);
  books.push(bookObject);

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  Swal.fire({
    title: `Berhasil menambahkan Buku "${getTitle}"`, 
    getTitle, getAuthor,
    icon: 'success',
  });
}

function generateId() {
  return +new Date();
}

function generateBookObject(id, title, author, year, isComplete) {
  return {
    id, title, author, year, isComplete
  }
}

function searchBook(judulBuku) {
  for (const book of books) {
    if (book.title.toLowerCase() === judulBuku.toLowerCase()) {
      filterBooks.push(book);
    }
  }
}

document.addEventListener(RENDER_EVENT, function () {
  const judulBuku = document.getElementById('cari').value;
  const uncompletedBooks = document.getElementById('uncompleted-books');
  uncompletedBooks.innerHTML = "";
  const completedBooks = document.getElementById('completed-books');
  completedBooks.innerHTML = "";

  if (searchMode) {
    const [countCompleteBooks, countUncompleteBooks] = countBooks(filterBooks);
    if (countCompleteBooks === 0) {
      completedBooks.append(addMessage(`Tidak ada judul buku "${judulBuku}"`));
    }
    if (countUncompleteBooks === 0) {
      uncompletedBooks.append(addMessage(`Tidak ada judul buku "${judulBuku}"`));
    }
    for (const book of filterBooks) {
      const bookElement = makeBook(book);
      if (!book.isComplete) {
        uncompletedBooks.append(bookElement);
      } else {
        completedBooks.append(bookElement);
      }
    }
  } else {
    for (const book of books) {
      const bookElement = makeBook(book);
      if (!book.isComplete) {
        uncompletedBooks.append(bookElement);
      } else {
        completedBooks.append(bookElement);
      }
    }
  }
});

function addMessage(message) {
  const tidakAdaHasil = document.createElement("div");
  tidakAdaHasil.classList.add("tidak-ada-hasil-pesan");
  tidakAdaHasil.innerText = message;
  return tidakAdaHasil;
}

function makeBook(bookData) {
  const bookAction = document.createElement("div");

  const titleBook = document.createElement("h3");
  titleBook.classList.add("judul-buku");
  titleBook.innerText = bookData.title;

  const bookAuthor = document.createElement("p");
  bookAuthor.classList.add("penulis-buku");
  bookAuthor.innerText =  " Penulis: " + bookData.author;

  const bookYear = document.createElement("p");
  bookYear.classList.add("tahun-buku");
  bookYear.innerText = " Tahun: " + bookData.year;

  const bookHeader = document.createElement("div");
  bookHeader.append(titleBook, bookAuthor);
  bookAction.append(bookHeader, bookYear);

  const container = document.createElement("div");
  container.classList.add("action");

  const bookContainer = document.createElement("div");
  bookContainer.classList.add("books");
  bookContainer.setAttribute("id", bookData.id);
  bookContainer.append(bookAction, container);

  if (bookData.isComplete) {
    const undoButton = document.createElement('button');
    undoButton.classList.add("btn-undo");

    undoButton.addEventListener("click", function () {
      undoBookFromCompleted(bookData.id);
    });
    container.append(undoButton);
  } else {
    const checkButton = document.createElement('button');
    checkButton.classList.add("btn-check");

    checkButton.addEventListener("click", function () {
      addBookToCompleted(bookData.id);
    });
    container.append(checkButton);
  }
  const trashButton = document.createElement('button');
  trashButton.classList.add("btn-trash");
  trashButton.addEventListener("click", function () {
    removeBookFromCompleted(bookData.id);
  });
  container.append(trashButton);

  return bookContainer;
}

function addBookToCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;
  bookTarget.isComplete = true;

  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  Swal.fire('Menambahkan buku sudah selesai dibaca');
}

function findBook(bookId) {
  for (const book of books) {
    if (book.id === bookId) {
      return book;
    }
  }
  return null;
}

function removeBookFromCompleted(bookId) {
  Swal.fire({
    title: 'Apakah yakin ingin menghapus buku ini?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Hapus'
  }).then((result) => {
    if (result.isConfirmed) {
      const bookTarget = findBookIndex(bookId);
      const filteredBookTarget = findFilteredBookIndex(bookId);
      if (bookTarget == -1) return;
      books.splice(bookTarget, 1);
      filterBooks.splice(filteredBookTarget, 1);
      document.dispatchEvent(new Event(RENDER_EVENT));
      saveData();
      Swal.fire(
        'Buku berhasil dihapus',
        '',
        'success'
      );
    }
  });
}

function undoBookFromCompleted(bookId) {
  const bookTarget = findBook(bookId);
  if (bookTarget == null) return;
  bookTarget.isComplete = false;
  document.dispatchEvent(new Event(RENDER_EVENT));
  saveData();
  Swal.fire('Menambahkan buku belum selesai dibaca');
}

function findBookIndex(bookId) {
  for (const index in books) {
    if (books[index].id === bookId) {
      return index;
    }
  }
  return -1;
}

function saveData() {
  if (isStorageExist()) {
    const parsed = JSON.stringify(books);
    localStorage.setItem(STORAGE_KEY, parsed);
  }
}

function isStorageExist() {
  if (typeof (Storage) === undefined) {
    alert('Browser kamu tidak mendukung local storage');
    return false;
  }
  return true;
}

document.addEventListener(SAVED_EVENT, function () {
  console.log(localStorage.getItem(STORAGE_KEY));
});

function loadDataFromStorage() {
  const serializedData = localStorage.getItem(STORAGE_KEY);
  let data = JSON.parse(serializedData);

  if (data !== null) {
    for (const book of data) {
      books.push(book);
    }
  }
  document.dispatchEvent(new Event(RENDER_EVENT));
}

function findFilteredBookIndex(bookId) {
  for (const index in filterBooks) {
    if (filterBooks[index].id === bookId) {
      return index;
    }
  }
  return -1;
}

function countBooks(books) {
  let completeBooks = 0;
  let uncompleteBooks = 0;
  for (const book of books) {
    if (book.isComplete) {
      completeBooks++;
    } else if (!book.isComplete) {
      uncompleteBooks++;
    }
  }
  return [completeBooks, uncompleteBooks];
}

document.addEventListener(SAVED_EVENT, () => {
  console.log('Data berhasil di simpan.');
});