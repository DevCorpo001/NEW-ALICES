using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Lineas.AgregarLinea;

public sealed record AgregarLineaCommand(
    string Codigo,
    string Nombre,
    string? Abreviado) : ICommand;
