namespace Bookstore.Api.Models;

public class Book
{
    public int BookID { get; set; }
    public string Title { get; set; } = null!;
    public string Author { get; set; } = null!;
    public string Publisher { get; set; } = null!;
    public string ISBN { get; set; } = null!;
    public string Classification { get; set; } = null!;
    public string Category { get; set; } = null!;
    public int PageCount { get; set; }
    public decimal Price { get; set; }
}

