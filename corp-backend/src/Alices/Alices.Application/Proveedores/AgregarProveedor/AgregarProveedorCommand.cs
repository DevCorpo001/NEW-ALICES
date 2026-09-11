using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Proveedores.AgregarProveedor;

public sealed record AgregarProveedorCommand(
    string Ruc,
    string RazonSocial,
    string? NombreComercial,
    string? Direccion,
    string? NombreVendedor) : ICommand;
