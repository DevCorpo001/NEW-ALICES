using Alices.Application.Abstractions.Messaging;

namespace Alices.Application.Autenticacion.IniciarSesion;

public sealed record IniciarSesionCommand(
    string Usuario,
    string Clave,
    byte IdTienda,
    string Ip) : ICommand<IniciarSesionResponse>;
