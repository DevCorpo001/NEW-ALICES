namespace Alices.Application.Catalogos;

/// <summary>
/// Regla común para sugerir el código de un registro nuevo de catálogo.
/// La usan línea, familia y clase.
/// </summary>
internal static class SiguienteCodigo
{
    private const string CodigoInicial = "001";

    /// <summary>
    /// Toma el mayor código puramente numérico y devuelve el siguiente,
    /// conservando el relleno de ceros más ancho observado (007 → 008).
    /// Los códigos no numéricos se ignoran; si no hay ninguno, empieza en 001.
    /// </summary>
    public static string Calcular(IEnumerable<string?> codigos)
    {
        var numericos = codigos
            .Select(codigo => codigo?.Trim())
            .Where(codigo => !string.IsNullOrEmpty(codigo) && codigo.All(char.IsAsciiDigit))
            .Select(codigo => codigo!)
            .ToList();

        if (numericos.Count == 0)
        {
            return CodigoInicial;
        }

        long maximo = 0;
        foreach (var codigo in numericos)
        {
            if (long.TryParse(codigo, out var valor) && valor > maximo)
            {
                maximo = valor;
            }
        }

        var ancho = numericos.Max(codigo => codigo.Length);
        return (maximo + 1).ToString().PadLeft(ancho, '0');
    }
}
