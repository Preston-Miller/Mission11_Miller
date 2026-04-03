using Bookstore.Api.Data;
using Bookstore.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Bookstore.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController : ControllerBase
{
    private readonly BookstoreContext _context;

    public BooksController(BookstoreContext context)
    {
        _context = context;
    }

    // Literal path segments before [HttpGet] and [HttpGet("{id}")] so /admin and /categories always match here.
    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<string>>> GetCategories()
    {
        var categories = await _context.Books.AsNoTracking()
            .Select(b => b.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();

        return Ok(categories);
    }

    [HttpGet("admin")]
    public async Task<ActionResult<IEnumerable<Book>>> GetAdminBooks()
    {
        var books = await _context.Books.AsNoTracking()
            .OrderBy(b => b.Title)
            .ToListAsync();

        return Ok(books);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Book>> GetBook(int id)
    {
        var book = await _context.Books.AsNoTracking()
            .FirstOrDefaultAsync(b => b.BookID == id);

        if (book == null)
        {
            return NotFound();
        }

        return book;
    }

    [HttpGet]
    public async Task<ActionResult<object>> GetBooks(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] string sortBy = "title",
        [FromQuery] string sortOrder = "asc"
    )
    {
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 5 : pageSize;

        IQueryable<Book> query = _context.Books.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(b => b.Category == category);
        }

        if (string.Equals(sortBy, "title", StringComparison.OrdinalIgnoreCase))
        {
            if (string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase))
            {
                query = query.OrderByDescending(b => b.Title);
            }
            else
            {
                query = query.OrderBy(b => b.Title);
            }
        }

        var totalCount = await query.CountAsync();

        var skip = (pageNumber - 1) * pageSize;
        var items = await query.Skip(skip).Take(pageSize).ToListAsync();

        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        return Ok(new
        {
            items,
            totalCount,
            pageNumber,
            pageSize,
            totalPages
        });
    }

    [HttpPost]
    public async Task<ActionResult<Book>> CreateBook([FromBody] BookInput input)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var book = new Book
        {
            Title = input.Title,
            Author = input.Author,
            Publisher = input.Publisher,
            ISBN = input.ISBN,
            Classification = input.Classification,
            Category = input.Category,
            PageCount = input.PageCount,
            Price = input.Price
        };

        _context.Books.Add(book);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetBook), new { id = book.BookID }, book);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateBook(int id, [FromBody] BookInput input)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var book = await _context.Books.FindAsync(id);
        if (book == null)
        {
            return NotFound();
        }

        book.Title = input.Title;
        book.Author = input.Author;
        book.Publisher = input.Publisher;
        book.ISBN = input.ISBN;
        book.Classification = input.Classification;
        book.Category = input.Category;
        book.PageCount = input.PageCount;
        book.Price = input.Price;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var book = await _context.Books.FindAsync(id);
        if (book == null)
        {
            return NotFound();
        }

        _context.Books.Remove(book);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
