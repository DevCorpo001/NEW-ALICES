using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Categorias.AgregarCategoria;

public sealed record AgregarCategoriaCommand(string Codigo, string Nombre) : ICommand;
