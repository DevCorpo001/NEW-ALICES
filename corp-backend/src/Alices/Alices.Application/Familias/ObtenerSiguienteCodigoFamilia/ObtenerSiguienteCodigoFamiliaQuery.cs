using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Familias.ObtenerSiguienteCodigoFamilia;

/// <summary>Código sugerido para una familia nueva, derivado de las existentes.</summary>
public sealed record ObtenerSiguienteCodigoFamiliaQuery
    : IQuery<SiguienteCodigoFamiliaResponse>;
