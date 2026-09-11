using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Familias.AgregarFamilia;

public sealed record AgregarFamiliaCommand(
    string Codigo,
    string Nombre,
    string? Abreviado,
    string? CodigoLinea) : ICommand;
