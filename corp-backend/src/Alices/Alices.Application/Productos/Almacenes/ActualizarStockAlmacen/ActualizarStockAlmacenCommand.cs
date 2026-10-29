using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Productos.Almacenes.ActualizarStockAlmacen;

public sealed record AjusteStockItem(
    short IdAlmacen,
    int Cantidad,
    string Operacion);

public sealed record ActualizarStockAlmacenCommand(
    int IdPrecio,
    IReadOnlyList<AjusteStockItem> Ajustes) : ICommand;
