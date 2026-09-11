using Alices.Domain.Abstractions;

namespace Alices.Domain.Marcas;

public static class MarcaErrors
{
    /// <summary>
    /// `sp_AgregarMarca` valida por su cuenta y devuelve el motivo del rechazo,
    /// así que el mensaje viene de la base en lugar de estar fijado aquí.
    /// </summary>
    public static Error NoRegistrada(string mensaje) => new(
        "Marca.NoRegistrada",
        string.IsNullOrWhiteSpace(mensaje) ? "No se pudo registrar la marca" : mensaje);
}
