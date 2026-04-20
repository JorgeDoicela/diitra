namespace diitra_domain.Common;

public interface IEntity<TId>
{
    TId Id { get; }
}

public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    string? CreatedBy { get; set; }
    DateTime? UpdatedAt { get; set; }
    string? UpdatedBy { get; set; }
}
