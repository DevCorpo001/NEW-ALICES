namespace Alices.Application.Productos.ListarHistorialPrecio;

/// <summary>Un movimiento registrado sobre un precio.</summary>
public sealed class CambioPrecioResponse
{
    public required long IdCambio { get; init; }
    public DateTime? Fecha { get; init; }

    /// <summary>`INSERT`, `UPDATE` o `DELETE`; el front lo pinta como estado.</summary>
    public string? Tipo { get; init; }

    public string? Usuario { get; init; }
    public int? Desde { get; init; }
    public decimal? PrecioUnitario { get; init; }

    /// <summary>Unidades compradas (`UND_COMP`); en la tabla se rotula UNIDAD.</summary>
    public int? UnidadesComp { get; init; }

    /// <summary>Unidades bonificadas (`UND_BNF`).</summary>
    public int? UnidadesBonificadas { get; init; }
    public decimal? Descuento1 { get; init; }
    public decimal? Descuento2 { get; init; }
}
