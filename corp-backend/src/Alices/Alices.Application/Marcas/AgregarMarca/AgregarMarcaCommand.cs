using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Marcas.AgregarMarca;

public sealed record AgregarMarcaCommand(string Codigo, string Nombre) : ICommand;
