using FluentValidation;

namespace Alices.Application.Proveedores.AgregarProveedor;

public sealed class AgregarProveedorCommandValidator : AbstractValidator<AgregarProveedorCommand>
{
    public AgregarProveedorCommandValidator()
    {
        RuleFor(x => x.Ruc)
            .NotEmpty().WithMessage("El RUC es obligatorio")
            .MaximumLength(20).WithMessage("El RUC no puede superar 20 caracteres");

        RuleFor(x => x.RazonSocial)
            .NotEmpty().WithMessage("La razón social es obligatoria")
            .MaximumLength(200).WithMessage("La razón social no puede superar 200 caracteres");

        RuleFor(x => x.NombreComercial)
            .MaximumLength(200).WithMessage("El nombre comercial no puede superar 200 caracteres");

        RuleFor(x => x.Direccion)
            .MaximumLength(300).WithMessage("La dirección no puede superar 300 caracteres");

        RuleFor(x => x.NombreVendedor)
            .MaximumLength(200).WithMessage("El nombre del vendedor no puede superar 200 caracteres");
    }
}
