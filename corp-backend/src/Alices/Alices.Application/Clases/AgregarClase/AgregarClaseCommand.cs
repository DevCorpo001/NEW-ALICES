using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Clases.AgregarClase;

public sealed record AgregarClaseCommand(
    string Codigo,
    string Nombre,
    string? NombreCorto,
    string? CodigoLinea,
    string? CodigoFamilia) : ICommand;
