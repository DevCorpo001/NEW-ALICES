using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.EliminarPreciosDeCanal;

/// <summary>
/// Elimina el precio que un producto tiene en un canal. En `PRECIO` eso son
/// varias filas: la base (`UNIDADES_MINIMAS = 1`) y una por cada rango.
/// </summary>
public sealed record EliminarPreciosDeCanalCommand(int IdProducto, int IdCanal) : ICommand;
