using Bookstore.Api.Data;
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

    [HttpGet]
    public async Task<ActionResult<object>> GetBooks(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] string sortBy = "title",
        [FromQuery] string sortOrder = "asc",
        [FromQuery] string? category = null
    )
    {
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize < 1 ? 5 : pageSize;

        IQueryable<Bookstore.Api.Models.Book> query = _context.Books.AsNoTracking();
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
            totalPages,
            category
        });
    }

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
}

