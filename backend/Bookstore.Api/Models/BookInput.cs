using System.ComponentModel.DataAnnotations;

namespace Bookstore.Api.Models;

public class BookInput
{
    [Required]
    [MaxLength(500)]
    public string Title { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string Author { get; set; } = null!;

    [Required]
    [MaxLength(200)]
    public string Publisher { get; set; } = null!;

    [Required]
    [MaxLength(32)]
    public string ISBN { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Classification { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Category { get; set; } = null!;

    [Range(1, int.MaxValue, ErrorMessage = "Page count must be at least 1.")]
    public int PageCount { get; set; }

    [Range(0, double.MaxValue, ErrorMessage = "Price must be zero or greater.")]
    public decimal Price { get; set; }
}
