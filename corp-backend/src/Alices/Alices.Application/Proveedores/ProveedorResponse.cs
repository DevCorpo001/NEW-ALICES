namespace Alices.Application.Proveedores;

public sealed class ProveedorResponse
{
    public required int IdProveedor { get; init; }
    public string? Ruc { get; init; }
    public string? RazonSocial { get; init; }
    public string? NombreComercial { get; init; }
    public string? Direccion { get; init; }
    public DateTime? FechaRegistro { get; init; }
}
