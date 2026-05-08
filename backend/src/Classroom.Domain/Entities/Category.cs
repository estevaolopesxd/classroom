namespace Classroom.Domain.Entities;

public class Category
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Color { get; set; } = "#C4267A";
    public string? Icon { get; set; }      // emoji ou nome de ícone
    public int Order { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
