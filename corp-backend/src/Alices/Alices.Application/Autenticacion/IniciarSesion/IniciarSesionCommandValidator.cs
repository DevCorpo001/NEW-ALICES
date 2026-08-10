using FluentValidation;

namespace Alices.Application.Autenticacion.IniciarSesion;

public sealed class IniciarSesionCommandValidator : AbstractValidator<IniciarSesionCommand>
{
    public IniciarSesionCommandValidator()
    {
        RuleFor(x => x.Usuario)
            .NotEmpty().WithMessage("El usuario es obligatorio")
            .MaximumLength(25).WithMessage("El usuario no puede superar 25 caracteres");

        RuleFor(x => x.Clave)
            .NotEmpty().WithMessage("La clave es obligatoria")
            .MaximumLength(50).WithMessage("La clave no puede superar 50 caracteres");

        RuleFor(x => x.IdTienda)
            .GreaterThan((byte)0).WithMessage("La tienda es obligatoria");
    }
}
