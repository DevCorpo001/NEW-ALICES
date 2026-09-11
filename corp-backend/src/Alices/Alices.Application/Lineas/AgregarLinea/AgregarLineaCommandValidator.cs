using FluentValidation;

namespace Alices.Application.Lineas.AgregarLinea;

public sealed class AgregarLineaCommandValidator : AbstractValidator<AgregarLineaCommand>
{
    public AgregarLineaCommandValidator()
    {
        RuleFor(x => x.Codigo)
            .NotEmpty().WithMessage("El código de línea es obligatorio")
            .MaximumLength(20).WithMessage("El código de línea no puede superar 20 caracteres");

        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre de línea es obligatorio")
            .MaximumLength(100).WithMessage("El nombre de línea no puede superar 100 caracteres");

        RuleFor(x => x.Abreviado)
            .MaximumLength(20).WithMessage("El abreviado no puede superar 20 caracteres");
    }
}
