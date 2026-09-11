using Alices.Domain.Abstractions;

namespace Alices.Domain.Categorias;

public static class CategoriaErrors
{
    /// <summary>
    /// `sp_AgregarCategoria` valida por su cuenta y devuelve el motivo del
    /// rechazo, así que el mensaje viene de la base.
    /// </summary>
    public static Error NoRegistrada(string mensaje) => new(
        "Categoria.NoRegistrada",
        string.IsNullOrWhiteSpace(mensaje) ? "No se pudo registrar la categoría" : mensaje);
}
